/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var School = require('../api/school/school.model');
var Student = require('../api/student/student.model');
var AbsenceRecord = require('../api/absence-record/absence-record.model');
var User = require('../api/user/user.model');

User.remove().exec().then(function() {
  return School.remove().exec();
}).then(function() {
  return Student.remove().exec();
}).then(function() {
  return User.create({
    provider: 'local',
    name: 'Test User',
    email: 'test@test.com'
  }, {
    provider: 'local',
    role: 'admin',
    name: 'Admin',
    email: 'admin@admin.com'
  }, logCreateResults('users'));
}).then(function() {
  return School.create({
    name: 'School A'
  }, {
    name: 'School B'
  }, logCreateResults('school'));
}).then(function(schoolA, schoolB) {
  // Fake names from http://homepage.net/name_generator/
  return Student.create({
    studentId: 'sid001',
    lastName: 'Graham',
    firstName: 'Brandon',
    currentSchool: schoolA._id
  }, {
    studentId: 'sid002',
    lastName: 'Simpson',
    firstName: 'Dan',
    currentSchool: schoolA._id
  }, {
    studentId: 'sid003',
    lastName: 'Arnold',
    firstName: 'Gavin',
    currentSchool: schoolA._id
  }, {
    studentId: 'sid004',
    lastName: 'Hughes',
    firstName: 'Victor',
    currentSchool: schoolB._id
  }, {
    studentId: 'sid005',
    lastName: 'Thomson',
    firstName: 'Sue',
    currentSchool: schoolB._id
  }, logCreateResults('students'));
}).then(function(student1, student2, student3, student4, student5) {
  // Sudo data from trello pdf
  return AbsenceRecord.create({
    schoolYear: '2015-2016',
    school: student1.currentSchool,
    entries: [{
      student: student1._id,
      absences: 1,
      tardies: 0,
      present: 15.0,
      enrolled: 16.0
    }, {
      student: student2._id,
      absences: 1,
      tardies: 0,
      present: 14.0,
      enrolled: 15.0
    }, {
      student: student3._id,
      absences: 1,
      tardies: 0,
      present: 21.0,
      enrolled: 22.0
    }]
  }, {
    schoolYear: '2015-2016',
    school: student4.currentSchool,
    entries: [{
      student: student4._id,
      absences: 1,
      tardies: 0,
      present: 1.0,
      enrolled: 1.0
    }, {
      student: student1._id,
      absences: 1,
      tardies: 0,
      present: 22.0,
      enrolled: 22.0
    }]
  }, logCreateResults('AbsenceRecord'));
}).then(function() {
  return Student.find().populate('currentSchool').exec(function(err, students) {
    console.log('\nSchools to Students');
    students.forEach(function(student) {
      console.log(
        student.currentSchool.name, ':', student.firstName, student.lastName);
    });
  });
});

function logCreateResults(model) {
  return function(err) {
    if (err) throw new Error('Error populating ' + model + ': ' + err);
    console.log('\nfinished populating ' + model);
    for (var i = 1; i < arguments.length; i++) {
      console.log(arguments[i]);
    }
  }
}