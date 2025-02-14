angular.module('bahmni.common.uiHelper')
  .directive('showMore', ['$timeout', function ($timeout) {
      return {
          restrict: 'A',
          link: function (scope, element, attrs) {
              function readConfig (name) {
                  if (scope.config && scope.config[name]) {
                      return scope.config[name];
                  } else if (scope.params && scope.params[name]) {
                      return scope.params[name];
                  } else if (scope.$parent && scope.$parent.params && scope.$parent.params[name]) {
                      return scope.$parent.params[name];
                  } else if (scope.$parent && scope.$parent.config && scope.$parent.config[name]) {
                      return scope.$parent.config[name];
                  } else {
                      console.log("Failed to find config for show-more");
                      return null;
                  }
              }
              var threshold = parseInt(readConfig("showMore"), 10) || null;
              if (threshold === null) return; // shortcut
              var initCount = parseInt(readConfig("showMoreInit"), 10) || threshold;      // how many items to show initially
              var showAll = false;
              function updateVisibility () {
                  let children = element.children();
                  var showCount = children.length;
                  if (children.length > threshold) {
                      showCount = showAll ? children.length : initCount;
                      showMoreBtn.css('display', showAll ? 'none' : 'block');
                      showLessBtn.css('display', showAll ? 'block' : 'none');
                  }
                  angular.forEach(children, function (child, index) {
                      angular.element(child).css('display', index < showCount ? '' : 'none');
                  });
              }

              var btnCss = {
                  display: 'none',
                  cursor: 'pointer',
                  padding: '5px'
              };
              setShowAllFn = (val) => function () {
                  scope.$apply(function () {
                      showAll = val;
                      updateVisibility();
                  });
              };

              var showMoreBtn = angular.element('<div>Show More...</div>');
              showMoreBtn.css(btnCss);
              showMoreBtn.on('click', setShowAllFn(true));
              element.after(showMoreBtn);

              var showLessBtn = angular.element('<div>Show Less</div>');
              showLessBtn.css(btnCss);
              showLessBtn.on('click', setShowAllFn(false));
              element.after(showLessBtn);

        // Connect Observer
              var observer = new MutationObserver(function (mutations) {
                  updateVisibility();
              });
              observer.observe(element[0], { childList: true, subtree: true });
              scope.$on('$destroy', function () {
                  observer.disconnect();
              });
              $timeout(updateVisibility, 0);
          }
      };
  }]);
