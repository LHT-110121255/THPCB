// controllers/AutoAssign.js
/* eslint-disable no-await-in-loop */
const Classrom = require('../../../../model/Classrom');
const Subject = require('../../../../model/Subject');
const TimetableSlot = require('../../../../model/Timetable');
const TeacherQuota = require('../../../../model/TeacherQuota');

/**
 * Cấu hình
 */
const DAYS = [2, 3, 4, 5, 6]; // Thứ 2 -> Thứ 6
const CORE_SUBJECTS = ['Toán', 'Tiếng Việt', 'SHTT'];
const DOUBLE_PERIOD_SUBJECTS = ['Tiếng Việt', 'Tiếng Anh', 'Ngữ Văn Khmer'];
const PLACEHOLDER_TEACHERS = ['Đang tuyển'];
const SUBSTITUTE_POOL = ['Thống', 'Trí'];

// Giới hạn/heuristics
const MAX_CONSEC_SAME_SUBJECT_PER_SESSION = 2; // chỉ cho phép tối đa 2 liên tiếp (tiết đôi). Không đặt 3 liên tiếp trong 1 buổi
const MAX_SAME_SUBJECT_PER_DAY = 4;            // tránh 1 ngày quá 4 tiết 1 môn (VD: Tiếng Việt)
const REQUIRE_FRIDAY_MORNING = true;           // sáng Thứ 6 phải có lịch
const BLOCKY_SUBJECTS = new Set(['HĐTN']);     // các môn nên gom block >=2 nếu có thể

/**
 * Helpers
 */
function makeRoundRobin(list) {
  let i = 0;
  return () => {
    const t = list[i % list.length];
    i++;
    return t;
  };
}
const nextSubstitute = makeRoundRobin(SUBSTITUTE_POOL);

function buildAllSlots() {
  const slots = [];
  for (const day of DAYS) {
    let startPeriod = 1;
    let morningPeriods = 4;
    if (day === 2) startPeriod = 2; // Chào cờ
    if (day === 6) morningPeriods = 3;

    // Sáng
    for (let p = 0; p < morningPeriods; p++) {
      const period = startPeriod + p;
      if (period > 4) break;
      slots.push({ day, session: 'Sáng', period });
    }
    // Chiều (trừ Thứ 6)
    if (day !== 6) {
      for (let p = 1; p <= 3; p++) {
        slots.push({ day, session: 'Chiều', period: p });
      }
    }
  }
  return slots;
}

// Lớp xa: tên như "1/2", "1-2", "2/2"... => yêu cầu cách tiết khi gv di chuyển
function parseClassDistance(className) {
  if (!className || typeof className !== 'string') return 0;
  const norm = className.replace(/\s+/g, '').replace('-', '/');
  // ví dụ 1/2, 2/2 => xa
  return /\/2($|\D)/.test(norm) ? 2 : 0;
}

// Tạo key nhanh
const slotKey = (s) => `${s.day}-${s.session}-${s.period}`;
const dayKey = (s) => `${s.day}`;
const daySessionKey = (s) => `${s.day}-${s.session}`;

/**
 * Kiểm tra/đánh giá constraints nhanh
 */
function ensureMapOfMaps(m, k1, k2, val = true) {
  if (!m.has(k1)) m.set(k1, new Map());
  m.get(k1).set(k2, val);
}

function ensureMapOfSets(m, k1, k2) {
  if (!m.has(k1)) m.set(k1, new Set());
  m.get(k1).add(k2);
}

/**
 * Lập kế hoạch phân bổ theo ngày (distribution):
 * - Rải đều các block của mỗi môn sang nhiều ngày (tránh dồn 1–2 ngày).
 * - Ưu tiên có mặt tại hầu hết các ngày đối với Tiếng Việt.
 */
function distributeDays(blocksPerSubject, allDays) {
  // Kết quả: Map(subjectName -> Array<day>)
  const plan = new Map();

  for (const [subjectName, blocks] of blocksPerSubject.entries()) {
    const nBlocks = blocks.length; // mỗi block là kích thước 1 hoặc 2
    // Số ngày mong muốn xuất hiện
    let desiredDays = Math.min(allDays.length, Math.max(1, Math.ceil(nBlocks / 2)));
    if (subjectName === 'Tiếng Việt') {
      // Tiếng Việt nên xuất hiện gần như mỗi ngày nếu nhiều tiết
      desiredDays = Math.min(allDays.length, Math.max(desiredDays, 4));
    }

    // Rải đều chỉ số ngày theo round-robin để trải đều
    const chosenDays = [];
    let idx = 0;
    for (let i = 0; i < nBlocks; i++) {
      const d = allDays[idx % desiredDays];
      chosenDays.push(d);
      idx++;
    }
    plan.set(subjectName, chosenDays);
  }

  return plan;
}

/**
 * Ghép block vào slot liên tiếp trong 1 BUỔI (không split buổi)
 * - Ưu tiên đặt đôi liền kề.
 * - Tôn trọng quota GV, không trùng giờ GV.
 * - Với lớp xa: cách 1–2 tiết với slot khác của GV trong cùng ngày.
 * - Giới hạn liên tiếp & trong ngày theo môn.
 */
class AutoAssign {
  Handle = async (req, res) => {
    try {
      const week = Number(req.body?.week || 1);

      // Load data
      const [classes, subjects, quotas] = await Promise.all([
        Classrom.find({}).lean(),
        Subject.find({}).lean(),
        TeacherQuota.find({}).lean()
      ]);

      // Index
      const subjectById = new Map(subjects.map(s => [String(s._id), s]));
      const quotaMap = new Map(quotas.map(q => [q.teacher, q]));
      const teacherLoad = new Map();

      const canAssignTeacher = (teacher, extra = 1) => {
        const used = teacherLoad.get(teacher) || 0;
        const q = quotaMap.get(teacher);
        if (!q) return true; // không có quota thì coi như không giới hạn
        return used + extra <= q.targetPeriodsPerWeek;
      };
      const bumpLoad = (teacher, inc = 1) => {
        teacherLoad.set(teacher, (teacherLoad.get(teacher) || 0) + inc);
      };

      /**
       * Tạo demands (nhu cầu TKB) theo lớp-môn, đồng thời chuẩn hoá GV:
       * - CORE_SUBJECTS -> GVCN
       * - Môn chuyên môn -> lấy teacher của subject (nếu 'Đang tuyển' thì pick substitute CHỈ KHI còn quota)
       */
      const demands = [];
      for (const c of classes) {
        for (const cs of (c.subjects || [])) {
          const subj = subjectById.get(String(cs.subject));
          if (!subj) continue;

          let teacher = '';
          if (CORE_SUBJECTS.includes(subj.name)) {
            teacher = c.GVCN;
          } else if (subj.ChuyenMon && subj.teacher?.trim()) {
            teacher = subj.teacher.trim();
            if (PLACEHOLDER_TEACHERS.includes(teacher)) {
              // substitute chỉ dùng khi còn quota
              let sub;
              let guard = 0;
              do {
                sub = nextSubstitute();
                guard++;
                if (guard > SUBSTITUTE_POOL.length + 2) break;
              } while (!canAssignTeacher(sub, 1));
              if (canAssignTeacher(sub, 1)) teacher = sub;
            }
          } else {
            teacher = c.GVCN;
          }

          const periods = Number(cs.SoTiet) || 0;
          if (periods <= 0) continue;

          demands.push({
            classId: c._id,
            className: c.name,
            classDistance: parseClassDistance(c.name),
            subjectId: subj._id,
            subjectName: subj.name,
            periods,
            teacher
          });
        }
      }

      // Chuẩn hóa thành các BLOCK (1 hoặc 2 tiết)
      // - Tiếng Việt: nếu chẵn -> toàn đôi; nếu lẻ -> ưu tiên đôi + 1 đơn
      // - Tiếng Anh/Ngữ Văn Khmer: ưu tiên đôi trước, dư thì đơn
      // - HĐTN: cố gắng tạo các block 2 trước
      const blocks = []; // {size:1|2, subjectName, subjectId, classId, className, teacher, classDistance}
      const blocksPerSubject = new Map(); // subjectName -> array(ref to blocks)

      for (const d of demands) {
        let remain = d.periods;

        const pushBlock = (size) => {
          const b = {
            size,
            subjectName: d.subjectName,
            subjectId: d.subjectId,
            classId: d.classId,
            className: d.className,
            teacher: d.teacher,
            classDistance: d.classDistance
          };
          blocks.push(b);
          if (!blocksPerSubject.has(d.subjectName)) blocksPerSubject.set(d.subjectName, []);
          blocksPerSubject.get(d.subjectName).push(b);
        };

        if (DOUBLE_PERIOD_SUBJECTS.includes(d.subjectName)) {
          // Tiếng Việt rule đặc biệt
          if (d.subjectName === 'Tiếng Việt') {
            while (remain >= 2) { pushBlock(2); remain -= 2; }
            if (remain === 1) { pushBlock(1); remain = 0; }
          } else {
            while (remain >= 2) { pushBlock(2); remain -= 2; }
            if (remain === 1) { pushBlock(1); remain = 0; }
          }
        } else if (BLOCKY_SUBJECTS.has(d.subjectName)) {
          while (remain >= 2) { pushBlock(2); remain -= 2; }
          if (remain === 1) { pushBlock(1); remain = 0; }
        } else {
          // mặc định từng tiết
          while (remain > 0) { pushBlock(1); remain--; }
        }
      }

      // Kế hoạch phân bố ngày
      const planBySubject = distributeDays(blocksPerSubject, DAYS);

      // Chuẩn bị slot & trạng thái occupation
      const allSlots = buildAllSlots();
      const slotsByDaySession = new Map(); // "day-session" -> periods sorted
      for (const s of allSlots) {
        const k = daySessionKey(s);
        if (!slotsByDaySession.has(k)) slotsByDaySession.set(k, []);
        slotsByDaySession.get(k).push(s);
      }
      // sort theo period
      for (const [k, arr] of slotsByDaySession) {
        arr.sort((a, b) => a.period - b.period);
      }

      // Occupancy
      const occupiedClass = new Map();   // classId -> Map(slotKey->true)
      const occupiedTeacher = new Map(); // teacher -> Map(slotKey->true)
      const subjectCountPerDay = new Map(); // classId-day -> Map(subjectName->count)
      const subjectRunPerSession = new Map(); // classId-day-session -> current consecutive subjectName & len
      const teacherSlotsByDay = new Map(); // teacher-day -> Set(period keys 'Sáng-1', 'Chiều-2'...) để check khoảng cách

      const isFreeForClass = (classId, s) => !(occupiedClass.get(String(classId))?.get(slotKey(s)));
      const isFreeForTeacher = (teacher, s) => !(occupiedTeacher.get(teacher)?.get(slotKey(s)));

      const getDaySubjectCount = (classId, s, subject) => {
        const k = `${classId}-${s.day}`;
        const m = subjectCountPerDay.get(k);
        return m?.get(subject) || 0;
      };

      const incDaySubjectCount = (classId, s, subject) => {
        const k = `${classId}-${s.day}`;
        if (!subjectCountPerDay.has(k)) subjectCountPerDay.set(k, new Map());
        const m = subjectCountPerDay.get(k);
        m.set(subject, (m.get(subject) || 0) + 1);
      };

      const getRunInfo = (classId, s) => {
        const k = `${classId}-${s.day}-${s.session}`;
        if (!subjectRunPerSession.has(k)) subjectRunPerSession.set(k, { lastSubject: null, len: 0, byPeriod: new Map() });
        return subjectRunPerSession.get(k);
      };

      const teacherDaySetKey = (s) => `${s.session}-${s.period}`;

      const occupy = (classId, teacher, s, subjectName) => {
        ensureMapOfMaps(occupiedClass, String(classId), slotKey(s), true);
        ensureMapOfMaps(occupiedTeacher, teacher, slotKey(s), true);
        incDaySubjectCount(classId, s, subjectName);

        // update run info
        const ri = getRunInfo(classId, s);
        ri.byPeriod.set(s.period, subjectName);
        if (ri.lastSubject === subjectName) {
          ri.len += 1;
        } else {
          ri.lastSubject = subjectName;
          ri.len = 1;
        }

        // teacher day set (để check khoảng cách lớp xa)
        const tKey = `${teacher}-${s.day}`;
        if (!teacherSlotsByDay.has(tKey)) teacherSlotsByDay.set(tKey, new Set());
        teacherSlotsByDay.get(tKey).add(teacherDaySetKey(s));
      };

      const teacherHasCloseSlot = (teacher, s, minGap = 1) => {
        // kiểm tra cùng ngày: có slot nào cách < minGap+? (ở đây yêu cầu cách 1–2 tiết => minGap=1 đủ, vì sẽ check |Δ| < 2)
        const tKey = `${teacher}-${s.day}`;
        const set = teacherSlotsByDay.get(tKey);
        if (!set || set.size === 0) return false;
        // so sánh theo buổi + period
        for (const tag of set) {
          const [session, pStr] = tag.split('-');
          const p = Number(pStr);
          if (session !== s.session) continue;
          if (Math.abs(p - s.period) < 2) return true;
        }
        return false;
      };

      /**
       * Tìm block liên tiếp rỗng có kích thước L trong 1 buổi
       */
      function findContiguousFreeRun(classId, teacher, day, session, L, subjectName, classDistance) {
        const arr = slotsByDaySession.get(`${day}-${session}`) || [];
        // window trượt kích thước L
        for (let i = 0; i + L - 1 < arr.length; i++) {
          const win = arr.slice(i, i + L);

          // kiểm tra free & constraints cho từng slot
          let ok = true;

          // Giới hạn trong ngày theo môn
          let dayCount = 0;
          for (const s of win) {
            if (!isFreeForClass(classId, s) || !isFreeForTeacher(teacher, s)) { ok = false; break; }
            if (!canAssignTeacher(teacher, 1)) { ok = false; break; }

            // Nếu lớp xa, yêu cầu cách >= 1–2 tiết với slot khác của GV trong cùng buổi
            if (classDistance) {
              if (teacherHasCloseSlot(teacher, s, 1)) { ok = false; break; }
            }

            dayCount++;
          }
          if (!ok) continue;

          // Check không vượt MAX_SAME_SUBJECT_PER_DAY
          const already = getDaySubjectCount(classId, { day }, subjectName);
          if (already + L > MAX_SAME_SUBJECT_PER_DAY) continue;

          // Check consecutive trong buổi
          // Lấy run info trước & xung quanh cửa sổ
          const runInfo = getRunInfo(classId, { day, session });
          // Kiểm tra tiền kỳ (slot trước cửa sổ)
          const arrFull = arr; // sorted
          const prevSlot = arrFull[i - 1];
          let prevSame = 0;
          if (prevSlot && runInfo.byPeriod.get(prevSlot.period) === subjectName) {
            // đếm ngược
            let p = prevSlot.period;
            while (runInfo.byPeriod.get(p) === subjectName) { prevSame++; p--; }
          }
          // Kiểm tra hậu kỳ (slot sau cửa sổ)
          const nextSlot = arrFull[i + L];
          let nextSame = 0;
          if (nextSlot && runInfo.byPeriod.get(nextSlot.period) === subjectName) {
            let p = nextSlot.period;
            while (runInfo.byPeriod.get(p) === subjectName) { nextSame++; p++; }
          }

          if (prevSame + L > MAX_CONSEC_SAME_SUBJECT_PER_SESSION) continue;
          if (nextSame + L > MAX_CONSEC_SAME_SUBJECT_PER_SESSION) continue;
          if (prevSame + L + nextSame > MAX_CONSEC_SAME_SUBJECT_PER_SESSION) continue;

          return win; // mảng slot hợp lệ liên tiếp L
        }
        return null;
      }

      /**
       * Sắp xếp:
       * 1) Ưu tiên đặt các block size=2 (đôi) theo kế hoạch ngày (không split buổi).
       * 2) Sau đó đặt block size=1.
       * 3) Bảo đảm sáng Thứ 6 có lịch cho mỗi lớp (nếu yêu cầu).
       */
      const created = [];
      const unassigned = [];

      // sort blocks: đôi trước, môn tiếng Việt trước để giữ quỹ slot đẹp
      blocks.sort((a, b) => {
        if (a.size !== b.size) return b.size - a.size; // 2 trước 1
        if (a.subjectName === 'Tiếng Việt' && b.subjectName !== 'Tiếng Việt') return -1;
        if (a.subjectName !== 'Tiếng Việt' && b.subjectName === 'Tiếng Việt') return 1;
        return 0;
      });

      // Đếm theo index của mỗi subject để lấy đúng ngày theo plan
      const subjectPlacedIndex = new Map(); // subjectName -> idx

      function pickPlannedDay(subjectName) {
        const idx = subjectPlacedIndex.get(subjectName) || 0;
        const arrDays = planBySubject.get(subjectName) || DAYS;
        const d = arrDays[idx % arrDays.length];
        subjectPlacedIndex.set(subjectName, idx + 1);
        return d;
      }

      // Hàm chèn block vào một day ưu tiên; nếu không được, thử các ngày khác
      function tryPlaceBlock(block) {
        const intendedDay = pickPlannedDay(block.subjectName);
        const dayOrder = [intendedDay, ...DAYS.filter(d => d !== intendedDay)]; // ưu tiên ngày theo plan

        for (const day of dayOrder) {
          // ưu tiên xếp trong buổi có nhiều chỗ trống hơn: buổi Sáng trước (để đảm bảo sáng T6)
          const sessions = day === 6 ? ['Sáng'] : ['Sáng', 'Chiều'];

          for (const session of sessions) {
            const run = findContiguousFreeRun(block.classId, block.teacher, day, session, block.size, block.subjectName, block.classDistance);
            if (!run) continue;

            // đặt block
            for (const s of run) {
              created.push({
                class: block.classId,
                subject: block.subjectId,
                subjectName: block.subjectName,
                teacher: block.teacher,
                day: s.day,
                session: s.session,
                period: s.period,
                week
              });
              occupy(block.classId, block.teacher, s, block.subjectName);
              bumpLoad(block.teacher, 1);
            }
            return true;
          }
        }
        return false;
      }

      // 1) Đặt block đôi trước
      for (const b of blocks.filter(x => x.size === 2)) {
        if (!canAssignTeacher(b.teacher, 2)) {
          unassigned.push({ className: b.className, subjectName: b.subjectName, teacher: b.teacher, periodsMissing: 2, reason: 'Hết quota GV cho block đôi' });
          continue;
        }
        const ok = tryPlaceBlock(b);
        if (!ok) {
          unassigned.push({ className: b.className, subjectName: b.subjectName, teacher: b.teacher, periodsMissing: 2, reason: 'Không tìm được 2 slot liên tiếp hợp lệ' });
        }
      }

      // 2) Đặt block đơn
      for (const b of blocks.filter(x => x.size === 1)) {
        if (!canAssignTeacher(b.teacher, 1)) {
          unassigned.push({ className: b.className, subjectName: b.subjectName, teacher: b.teacher, periodsMissing: 1, reason: 'Hết quota GV' });
          continue;
        }
        const ok = tryPlaceBlock(b);
        if (!ok) {
          unassigned.push({ className: b.className, subjectName: b.subjectName, teacher: b.teacher, periodsMissing: 1, reason: 'Không tìm được slot hợp lệ' });
        }
      }

      // 3) Đảm bảo sáng Thứ 6 có lịch (nếu bật), tránh để trống
      if (REQUIRE_FRIDAY_MORNING) {
        const fridayMorningKey = '6-Sáng';
        const fridaySlots = (slotsByDaySession.get(fridayMorningKey) || []).filter(s => s.period <= 3);
        const classesSet = new Set(classes.map(c => String(c._id)));
      
        for (const classId of classesSet) {
          for (const s of fridaySlots) {
            const hasSubject = occupiedClass.get(String(classId))?.get(slotKey(s));
            if (hasSubject) continue; // slot này đã có tiết
      
            // Tìm block đơn để move hoặc đặt mới
            let placed = false;
      
            // Thử move 1 tiết đã gán ở ngày khác sang đây
            for (let i = 0; i < created.length; i++) {
              const rec = created[i];
              if (String(rec.class) !== String(classId)) continue;
              if (rec.session === 'Sáng' && rec.day === 6) continue; // đã ở sáng T6
      
              // chỉ move block đơn
              const blockSize = created.filter(r => 
                r.class === rec.class && r.subjectName === rec.subjectName && 
                r.day === rec.day && r.session === rec.session
              ).length;
      
              if (blockSize > 1) continue; // skip block đôi
      
              if (!isFreeForClass(classId, s) || !isFreeForTeacher(rec.teacher, s)) continue;
      
              // Move tiết này sang slot T6
              const oldKey = slotKey({ day: rec.day, session: rec.session, period: rec.period });
              occupiedClass.get(String(classId))?.delete(oldKey);
              occupiedTeacher.get(rec.teacher)?.delete(oldKey);
      
              rec.day = s.day;
              rec.session = s.session;
              rec.period = s.period;
              occupy(classId, rec.teacher, s, rec.subjectName);
      
              placed = true;
              break;
            }
      
            if (!placed) {
              // Nếu chưa move được, tạo tiết rỗng báo lỗi
              unassigned.push({ 
                className: classes.find(c => String(c._id) === String(classId))?.name, 
                subjectName: 'N/A', 
                teacher: 'N/A', 
                periodsMissing: 1, 
                reason: `Thiếu tiết sáng Thứ 6 (tiết ${s.period})`
              });
            }
          }
        }
      }

      // Ghi DB
      await TimetableSlot.deleteMany({ week });
      if (created.length) await TimetableSlot.insertMany(created);

      res.status(200).json({
        success: true,
        message: 'Phân công tự động hoàn tất (constraint scheduling)',
        week,
        stats: {
          slotsCreated: created.length,
          teachersLoad: Array.from(teacherLoad.entries()).map(([t, n]) => ({ teacher: t, periods: n })),
          unassigned
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi phân công tự động', error: err.message });
    }
  };
}

module.exports = new AutoAssign();