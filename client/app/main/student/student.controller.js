'use strict';

var app = angular.module('app');

function StudentCtrl($scope, $state, $stateParams, Student, 
  AbsenceRecord, toastr) {
  $scope.student = Student.get({id: $stateParams.id});
  $scope.student.$promise.then(function(student) {
    _.forEach(student.interventions, function(intervention) {
      // Replaces actionDates with Date objects expected by uib-datepicker.
      if (intervention.actionDate) {
        intervention.actionDate = new Date(intervention.actionDate);
      }
    });
  });

  $scope.calcPercentage = function() {
    AbsenceRecord.current()
      .$promise.then(function(records) {
        var totPresent = [];
        var totEnrolled = [];
        var addToNext = function(prev, cur) {
          return prev + cur;
        };
        records.forEach(function(record) {
          totPresent.push(record.entries.present);
          totEnrolled.push(record.entries.enrolled);
        });
        $scope.percentage = Math.floor(
          (totPresent.reduce(addToNext) / totEnrolled.reduce(addToNext))
          * 100);
      });
  };

  $scope.calcPercentage();

  $scope.updateIEP = function() {
    var oldValue = !$scope.student.iep;
    Student.updateIEP({
      id: $scope.student._id
    }, {
      iep: $scope.student.iep
    }, function() {
      toastr.success(
        'IEP updated to ' + $scope.student.iep,
        $scope.student.firstName + ' ' + $scope.student.lastName);
    }, function(err) {
      $scope.student.iep = oldValue;
      toastr.error(err);
    });
  };

  $scope.updateCFA = function() {
    var oldValue = !$scope.student.cfa;
    Student.updateCFA({
      id: $scope.student._id
    }, {
      cfa: $scope.student.cfa
    }, function() {
      toastr.success(
        'CFA updated to ' + $scope.student.cfa,
        $scope.student.firstName + ' ' + $scope.student.lastName);
    }, function(err) {
      $scope.student.cfa = oldValue;
      toastr.error(err);
    });
  };

  $scope.tabs = [{
    title: 'Interventions',
    state: 'interventions'
  }, {
    title: 'Outreaches',
    state: 'outreaches'
  }];

  $scope.tabs.selected =
    _.find($scope.tabs, {state: $state.$current.name}) || $scope.tabs[0];
  $state.go($scope.tabs.selected.state);
}

function StudentInterventionCtrl($scope, Intervention, toastr) {
  $scope.datePopups = [];
  $scope.open = function(index) {
    $scope.datePopups[index] = true;
  };
  $scope.maxDate = Date.now();

  $scope.updateActionDate = function(intervention) {
    Intervention.updateAction(
      {id: intervention._id},
      {actionDate: intervention.actionDate},
      function(res) {
        var student = res.student;
        toastr.success(
          'Action Taken successfully updated.',
          [student.firstName, student.lastName, res.type, res.tier].join(' ')
        );
      });
  };

  $scope.addInterventionNote = function(intervention) {
    if (intervention.newNote) {
      var newNote = intervention.newNote;
      delete intervention.newNote;
      Intervention.addNote(
        {id: intervention._id},
        {note: newNote},
        function(res) {
          intervention.notes.push(res.notes[res.notes.length - 1]);
          var student = res.student;
          toastr.success(
            'New intervention note added.',
            [student.firstName, student.lastName, res.type, res.tier].join(' ')
          );
        });
    }
  };
}

function StudentOutreachesCtrl($scope, Outreach, Modal, toastr) {
  $scope.createOutreachNote = function(outreach) {
    if (outreach.newNote) {
      var newNote = outreach.newNote;
      delete outreach.newNote;
      Outreach.createNote(
        {id: outreach._id},
        {note: newNote},
        function(res) {
          outreach.notes.push(res.notes[res.notes.length - 1]);
          var student = res.student;
          toastr.success(
            'New outreach note created.',
            [student.firstName, student.lastName, res.type, res.tier].join(' ')
          );
        });
    }
  };

  $scope.toggleOutreachArchived = function(outreach) {
    Outreach.updateArchived({
      id: outreach._id
    }, {
      archived: !outreach.archived
    }, function(toggledOutreach) {
      outreach.archived = toggledOutreach.archived;
      toastr.info(
        'The ' + outreach.type + ' outreach has been ' +
        (toggledOutreach.archived ? '' : 'un') + 'archived.');
    }, function(err) {
      console.log(err);
      toastr.error(err);
    });
  };

  $scope.deleteOutreach = function(outreach) {
    var deleteFn = function(model) {
      return Outreach.remove({}, model, function() {
        _.pull($scope.student.outreaches, model);
        toastr.warning('Outreach ' + model.type + ' has been deleted.');
      }, function(err) {
        console.log(err);
        toastr.error(err);
      });
    };
    Modal.confirmDelete(
      'Delete Outreach',
      'app/main/student/partial/modal.delete-outreach.html',
      outreach,
      deleteFn);
  };

  $scope.menuItems = [{
    text: 'Create New Outreach',
    action: function() {
      var createOutreachFn = function(model) {
        model.student = $scope.student._id;
        model.school = $scope.student.currentSchool._id;
        return Outreach.save({}, model, function(res) {
          $scope.$evalAsync(function() {
            $scope.student.outreaches.push(res);
          });
        });
      };
      Modal.form(
        'Create New Outreach',
        'app/main/student/partial/modal.create-outreach.html',
        createOutreachFn);
    }
  }];
}

app.controller('StudentCtrl', StudentCtrl);
app.controller('StudentInterventionCtrl', StudentInterventionCtrl);
app.controller('StudentOutreachesCtrl', StudentOutreachesCtrl);

