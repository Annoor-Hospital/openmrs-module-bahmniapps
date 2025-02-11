angular.module('bahmni.common.uiHelper')
  .directive('showMore', ['$timeout', function ($timeout) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var showCount = parseInt(attrs.show, 10) || 6; // Default to 6 if not specified
        var moreCount = parseInt(attrs.more, 10) || null; // Null means show all
        
        function updateVisibility() {
          console.log(element);
          let children = element.children();
          console.log(children.length);
          console.log(showCount);
          angular.forEach(children, function(child, index) {
            angular.element(child).css('display', index < showCount ? '' : 'none');
          });

          if (showCount < children.length) {
            showMoreBtn.css('display', 'block');
          } else {
            showMoreBtn.css('display', 'none');
          }
        }

        var observer = new MutationObserver(function(mutations) {
          updateVisibility();
        });
        observer.observe(element[0], { childList: true, subtree: true });
        scope.$on('$destroy', function() {
          observer.disconnect();
        });

        // Add "Show More" button
        var showMoreBtn = angular.element('<div>Show More...</div>');
        showMoreBtn.css({
          display: 'block',
          cursor: 'pointer',
          padding: '5px',
          fontWeight: 'bold'
        });

        showMoreBtn.on('click', function() {
          let children = element.children();
          console.log(children.length);
          scope.$apply(function() {
            if (moreCount) {
              showCount = Math.min(showCount + moreCount, children.length);
            } else {
              showCount = children.length; // Show all if "more" is not provided
            }
            updateVisibility();
          });
        });

        element.after(showMoreBtn);
        
        $timeout(updateVisibility, 0);
      }
    };
  }]);