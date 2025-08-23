const express = require('express');
const router = express.Router();
const CreateUserCommand = require('../../app/controllers/command/user/CreateUser');
const UpdateUserCommand = require('../../app/controllers/command/user/UpdateUser');
const DeleteUserCommand = require('../../app/controllers/command/user/DeleteUser');
const userController = require('../../app/controllers/command/user/Login');
const GetUserQuery = require('../../app/controllers/query/UserQuery');
const upload = require('../../app/Extesions/uploadAvatar');

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: API for managing users
 */

/**
 * @swagger
 * /user/create:
 *   post:
 *     summary: Create a new user account
 *     tags: [Users]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               userName:
 *                 type: string
 *               fullName:
 *                 type: string
 *               birthday:
 *                 type: string
 *                 format: date
 *               numberPhone:
 *                 type: string
 *               address:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation errors
 *       500:
 *         description: Internal server error
 */
router.post('/create', upload.single('avatar'), (req, res) => {
  CreateUserCommand.Handle(req, res);
});

/**
 * @swagger
 * /user/changPassword:
 *   put:
 *     summary: Change the password of a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               passwordOld:
 *                 type: string
 *               passwordNew:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation errors
 *       403:
 *         description: Incorrect old password
 *       500:
 *         description: Internal server error
 */
router.put('/changPassword', (req, res) => {
  UpdateUserCommand.ChangePassword(req, res);
});

/**
 * @swagger
 * /user/updateUser/{id}:
 *   put:
 *     summary: Update the details of an existing user
 *     tags: [Users]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               userName:
 *                 type: string
 *               fullName:
 *                 type: string
 *               birthday:
 *                 type: string
 *                 format: date
 *               numberPhone:
 *                 type: string
 *               address:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation errors
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put('/updateUser/:id', upload.single('avatar'), (req, res) => {
  UpdateUserCommand.Handle(req, res);
});

/**
 * @swagger
 * /user/restore/{id}:
 *   put:
 *     summary: Restore a deleted user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User restored successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put('/restore/:id', (req, res) => {
  UpdateUserCommand.restore(req, res);
});

/**
 * @swagger
 * /user/disable/{id}:
 *   put:
 *     summary: Disable (soft delete) a user account
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User disabled successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put('/disable/:id', (req, res) => {
  DeleteUserCommand.disable(req, res);
});

/**
 * @swagger
 * /user/delete/{id}:
 *   delete:
 *     summary: Permanently delete a user account
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.delete('/delete/:id', (req, res) => {
  DeleteUserCommand.delete(req, res);
});

/**
 * @swagger
 * /user/getAll:
 *   get:
 *     summary: Get a list of all users
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: A list of users
 *       500:
 *         description: Internal server error
 */
router.get('/getAll', (req, res) => {
  GetUserQuery.getAllUsers(req, res);
});

/**
 * @swagger
 * /user/getById/{id}:
 *   get:
 *     summary: Get user details by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/getById/:id', (req, res) => {
  GetUserQuery.getUserById(req, res);
});

router.get('/me', userController.getCurrentUser);

module.exports = router;
