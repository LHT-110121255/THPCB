const path = require("path");
const ExcelJS = require("exceljs");
const Classroom = require("../../../../model/Classrom"); 
const Slot = require("../../../../model/Timetable");         
const Subject = require("../../../../model/Subject");

const thuToCol = {
  2: "C", // Thứ 2
  3: "D",
  4: "E",
  5: "F",
  6: "G"
};

const ExportAssign = {
  Student: async (req, res) => {
    try {
      const templatePath = path.join(
        process.cwd(),
        "src",
        "public",
        "TemplateExcel",
        "TemplateXuat_TKBHocSinh.xlsx"
      );
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(templatePath);
      const worksheet = workbook.getWorksheet(1);

      const classrooms = await Classroom.find()
        .populate({
          path: "subjects.subject",
          model: Subject,
          select: "name ChuyenMon teacher",
        })
        .lean();

      const allSlots = await Slot.find().lean();

      classrooms.forEach((classroom, index) => {
        const startRow = 4 + index * 13;

        worksheet.getCell(`B${startRow}`).value = `${classroom.Khoi || ""}`;
        worksheet.getCell(`B${startRow + 1}`).value = `${classroom.name || ""}`;
        worksheet.getCell(`B${startRow + 2}`).value = `${classroom.GVCN || ""}`;
        worksheet.getCell(`B${startRow + 2}`).alignment = {
          wrapText: true,
          vertical: "middle",
          horizontal: "left",
        };

        const slots = allSlots.filter(
          (s) => String(s.class) === String(classroom._id)
        );

        slots.forEach((slot) => {
          const col = thuToCol[slot.day];
          let row;

          if (slot.session === "Sáng") {
            row = startRow + 4 + (slot.period - 1);
          } else {
            row = startRow + 9 + (slot.period - 1);
          }

          if (col && row) {
            worksheet.getCell(`${col}${row}`).value = `${slot.subjectName}\n(${slot.teacher})` || "";
            worksheet.getCell(`${col}${row}`).alignment = {
              wrapText: true,
              vertical: "middle",
              horizontal: "center",
            };
          }
        });
      });

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=TKB_HocSinh.xlsx"
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error("ExportAssign.Student error:", err);
      res.status(500).send("Xuất Excel thất bại");
    }
  },

  Teacher: async (req, res) => {
    try {
      const templatePath = path.join(
        process.cwd(),
        "src",
        "public",
        "TemplateExcel",
        "TemplateXuat_TKBGiaoVien.xlsx"
      );
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(templatePath);
      const worksheet = workbook.getWorksheet(1);

      const allSlots = await Slot.find()
        .sort({ day: 1, session: 1, period: 1 })
        .lean();

      const classrooms = await Classroom.find()
        .populate({
          path: "subjects.subject",
          model: Subject,
          select: "name ChuyenMon teacher",
        })
        .lean();

      // gom theo teacher
      const teacherMap = {};
      allSlots.forEach((slot) => {
        if (!teacherMap[slot.teacher]) teacherMap[slot.teacher] = [];
        teacherMap[slot.teacher].push(slot);
      });

      let index = 0;
      for (const teacherName of Object.keys(teacherMap)) {
        const slots = teacherMap[teacherName];
        const startRow = 4 + index * 13;

        // Lấy ra tất cả lớp mà GV này dạy
        const classIds = [...new Set(slots.map((s) => String(s.class)))];
        const classesOfTeacher = classrooms.filter((c) =>
          classIds.includes(String(c._id))
        );

        // Loại bỏ trùng khối
      const khoiStr = [...new Set(classesOfTeacher.map(c => c.Khoi || ""))].join(", ");

      // Loại bỏ trùng lớp
      const lopStr = [...new Set(classesOfTeacher.map(c => c.name || ""))].join(", ");

      // Ghi thông tin chung vào file Excel
      worksheet.getCell(`B${startRow}`).value = `Khối: ${khoiStr}`;
      worksheet.getCell(`B${startRow + 1}`).value = `Lớp: ${lopStr}`;
      worksheet.getCell(`B${startRow + 2}`).value = `Giáo viên: ${teacherName}`;
      worksheet.getCell(`B${startRow + 2}`).alignment = {
      wrapText: true,
      vertical: "middle",
      horizontal: "left",
      };
        // Ghi TKB chính (C-G cột)
        slots.forEach((slot) => {
          const col = thuToCol[slot.day];
          let row;
          if (slot.session === "Sáng") {
            row = startRow + 4 + (slot.period - 1);
          } else {
            row = startRow + 9 + (slot.period - 1);
          }
          if (col && row) {
            worksheet.getCell(`${col}${row}`).value = `${slot.subjectName}\n(${slot.className || slot.class})`;
            worksheet.getCell(`${col}${row}`).alignment = {
              wrapText: true,
              vertical: "middle",
              horizontal: "center",
            };
          }
        });

        // Ghi bảng phụ K-O chỉ tên giáo viên
        const thuToColPhu = { 2: "K", 3: "L", 4: "M", 5: "N", 6: "O" };
        slots.forEach((slot) => {
          const col = thuToColPhu[slot.day];
          let row;
          if (slot.session === "Sáng") {
            row = startRow + 4 + (slot.period - 1);
          } else {
            row = startRow + 9 + (slot.period - 1);
          }
          if (col && row) {
            worksheet.getCell(`${col}${row}`).value = teacherName;
            worksheet.getCell(`${col}${row}`).alignment = {
              wrapText: true,
              vertical: "middle",
              horizontal: "center",
            };
          }
        });

        index++;
      }

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=TKB_GiaoVien.xlsx"
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error("ExportAssign.Teacher error:", err);
      res.status(500).send("Xuất Excel thất bại");
    }
  },
};

module.exports = {
  Student: ExportAssign.Student,
  Teacher: ExportAssign.Teacher,
};
