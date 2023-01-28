'use strict';

const express = require('express');
const { asyncHandler } = require('./middleware/async-handler');
const { User } = require('./models');
const { Course } = require('./models');
const { authenticateUser } = require('./middleware/auth-user');

// Construct a router instance.
const router = express.Router();

//---------------------- USER ROUTES //----------------------

//GET: Route that returns the current autorized user.
router.get('/users', authenticateUser, asyncHandler(async (req, res) => {
  const user = req.currentUser;
  console.log(req.currentUser)
  res.json({
    id: user.id,
    emailAddress: user.emailAddress,
    firstName: user.firstName,
    lastName: user.lastName,
  });
}));

//POST: Route that creates a new user.
router.post('/users', asyncHandler(async (req, res) => {
  try {
    await User.create(req.body);
    res.status(201)
      .location("/")
      .json({ "message": "Account successfully created!" });
  } catch (error) {
    console.log(error.name)
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map(err => err.message);
      res.status(400).json({ errors });
    } else {
      throw error;
    }
  }
}));


//------------------ COURSES ROUTES ------------------
//GET: route that will return all courses including the User associated with each course
router.get('/courses', asyncHandler(async (req, res) => {
  const courses = await Course.findAll({
    attributes: [
      "id",
      "title",
      "description",
      "estimatedTime",
      "materialsNeeded",
      "userId"
    ],
    include: [
      {
        model: User,
        as: 'user',
        attributes: [
          "firstName",
          "lastName",
          "emailAddress"
        ],
      },
    ],
  });
  res.status(200).json(courses);
}));

//GET: route that will return the corresponding course specified by the :id parameter, including the User associated with that course.
router.get('/courses/:id', asyncHandler(async (req, res) => {
  const course = await Course.findByPk(req.params.id, {
    attributes: [
      "id",
      "title",
      "description",
      "estimatedTime",
      "materialsNeeded",
      "userId"
    ],
    include: [
      {
        model: User,
        as: 'user',
        attributes: [
          "firstName",
          "lastName",
          "emailAddress"
        ],
      },
    ],
  });
  if (course) {
    res.status(200).json(course);
  } else {
    res.status(404).json({ message: "Course not found" });
  }
}));

//POST: route that will create a new course, set the Location header to the URI for the newly created course, and return a 201 HTTP status code and no content.
router.post('/courses', authenticateUser, asyncHandler(async (req, res) => {
  // add the userId of the current user to the course object
  req.body.userId = req.currentUser.id;

  try {
    const course = await Course.create(req.body);
    await course.setUser(req.currentUser);

    res.status(201)
      .location(`/courses/${course.id}`)
      .end();
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map(err => err.message);
      res.status(400).json({ errors });
    } else {
      throw error;
    }
  }
}));

//PUT: route that will update the corresponding course and return a 204 HTTP status code and no content.
router.put('/courses/:id', authenticateUser, asyncHandler(async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  if (course) {
    if (course.userId === req.currentUser.id) {
      try {
        await course.update(req.body);
        res.status(204).end();
      } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
          const errors = error.errors.map(err => err.message);
          res.status(400).json({ errors });
        } else {
          throw error;
        }
      }
    } else {
      res.status(403).json({ message: 'You are not authorized to update this course' });
    }
  } else {
    res.status(404).json({ message: 'Course not found' });
  }
}));


//DELETE: route that will delete the corresponding course and return a 204 HTTP status code and no content.
router.delete('/courses/:id', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
    } else if (course.userId !== req.currentUser.id) {
      res.status(403).json({ message: "Not authorized to delete this course" });
    } else {
      await course.destroy();
      res.status(204).end();
    }
  } catch (error) {
    res.status(500).json({ message: `Unexpected error occured! ${error.message}` });
  }
}));

module.exports = router;