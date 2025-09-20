angular.module('motofyApp')
  .controller('AdminCarController', ['ApiService', '$timeout', '$scope', function(ApiService, $timeout, $scope) {
    var vm = this;

    vm.viewMode = 'list';     // 'list' | 'form'
    vm.cars = [];
    vm.formData = {};
    vm.editingId = null;
    vm.error = '';
    vm.success = '';
    vm.previewUrl = '';
    vm.viewStyle = 'table'; // default
    vm.setViewStyle = function(style) {
      vm.viewStyle = style;
    };


    vm.imageUrl = function(filename) {
      return 'https://motofy-l5gq.onrender.com/uploads/cars/' + filename;
    };
    vm.toggleView = function() {
      if (vm.viewMode === 'list') {
        vm.showAddForm();
      } else {
        vm.cancelForm();
      }
    };

    vm.resetAlerts = function() { vm.error=''; vm.success=''; };

    vm.loadCars = function() {
      vm.resetAlerts();
      ApiService.getAllCars()
        .then(function(res) { vm.cars = res.data || []; })
        .catch(function() { vm.error = 'Failed to load cars.'; });
    };

    vm.showAddForm = function() {
      vm.resetAlerts();
      vm.viewMode = 'form';
      vm.editingId = null;
      vm.formData = { name:'', brand:'', carNumber:'', price:null, fuelType:'', seats:null, transmission:'', description:'' };
      vm.previewUrl = '';
    };

    vm.showEditForm = function(car) {
      vm.resetAlerts();
      vm.viewMode = 'form';
      vm.editingId = car._id;
      vm.formData = {
        name: car.name,
        brand: car.brand,
        carNumber: car.carNumber || '',
        price: car.price,
        fuelType: car.fuelType,
        seats: car.seats,
        transmission: car.transmission,
        description: car.description || ''
      };
      vm.previewUrl = car.image ? vm.imageUrl(car.image) : '';
      vm.formData.imageFile = null;
    };

    vm.cancelForm = function() {
      vm.viewMode = 'list';
      vm.editingId = null;
      vm.formData = {};
      vm.previewUrl = '';
    };

    vm.saveCar = function() {
      vm.resetAlerts();

      var fd = new FormData();
      fd.append('name', vm.formData.name || '');
      fd.append('brand', vm.formData.brand || '');
      fd.append('carNumber', vm.formData.carNumber || '');
      fd.append('price', vm.formData.price || 0);
      fd.append('fuelType', vm.formData.fuelType || '');
      fd.append('seats', vm.formData.seats || 0);
      fd.append('transmission', vm.formData.transmission || '');
      fd.append('description', vm.formData.description || '');
      if (vm.formData.imageFile) fd.append('image', vm.formData.imageFile);

      var p = vm.editingId
        ? ApiService.updateCar(vm.editingId, fd)
        : ApiService.addCar(fd);

      p.then(function() {
          vm.success = vm.editingId ? 'Car updated successfully' : 'Car added successfully';
          vm.cancelForm();
          $timeout(vm.loadCars, 150);
        })
        .catch(function(err) {
          vm.error = (err && err.data && (err.data.message || err.data.errors && err.data.errors[0] && err.data.errors[0].msg))
            ? (err.data.message || err.data.errors[0].msg)
            : 'Failed to save car.';
        });
    };

    vm.deleteCar = function(id) {
      vm.resetAlerts();
      if (!confirm('Delete this car?')) return;
      ApiService.deleteCar(id)
        .then(function() {
          vm.success = 'Car deleted';
          vm.loadCars();
        })
        .catch(function() { vm.error = 'Failed to delete car.'; });
    };

    vm.toggleAvailability = function(car) {
      vm.resetAlerts();
      ApiService.toggleCarAvailability(car._id)
        .then(function(response) {
          car.availability = response.data.availability;
          vm.success = response.data.message;
          // Refresh analytics if parent controller exists
          if ($scope.$parent.adminDashboard && $scope.$parent.adminDashboard.loadCarAnalytics) {
            $scope.$parent.adminDashboard.loadCarAnalytics();
          }
        })
        .catch(function() { 
          vm.error = 'Failed to update car availability.'; 
        });
    };

    // Refresh whenever admin switches to Cars tab
    $scope.$watch(
      function() {
        return $scope.$parent.adminDashboard.activeSection;
      },
      function(newVal) {
        if (newVal === 'cars') {
          vm.loadCars();
        }
      }
    );

    // Initial load
    vm.loadCars();
  }])
  .directive('fileModel', ['$parse', function($parse) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var model = $parse(attrs.fileModel);
        element.bind('change', function() {
          scope.$apply(function() {
            var file = element[0].files && element[0].files[0];
            model.assign(scope, file || null);

            if (file && /^image\//.test(file.type)) {
              var reader = new FileReader();
              reader.onload = function(e) {
                if (scope.adminCar) scope.$apply(function(){ scope.adminCar.previewUrl = e.target.result; });
              };
              reader.readAsDataURL(file);
            } else {
              if (scope.adminCar) scope.$apply(function(){ scope.adminCar.previewUrl = ''; });
            }
          });
        });
      }
    };
  }]);
