(function () {

    angular
        .module('jwShowcase.core')
        .service('cookies', cookiesService);

    /**
     * @ngdoc service
     * @name jwShowcase.core.cookies
     *
     * @required $rootScope
     * @requires $controller
     * @required $templateCache
     * @required $ionicPopover
     * @requires jwShowcase.core.userSettings
     * @requires jwShowcase.config
     */
    cookiesService.$inject = ['$rootScope', '$controller', '$templateCache', '$ionicPopover', 'userSettings', 'config'];
    function cookiesService ($rootScope, $controller, $templateCache, $ionicPopover, userSettings, config) {

        var template,
            popover;

        this.hide         = hide;
        this.show         = show;
        this.showIfNeeded = showIfNeeded;

        activate();

        ////////////////

        /**
         * Initialize service
         */
        function activate () {

            template = $templateCache.get('views/core/cookies.html');
        }

        /**
         * Position popover element
         * @param target
         * @param popoverElement
         */
        function positionView (target, popoverElement) {

            popoverElement.css({
                margin: 0,
                top:    0,
                left:   0,
                width:  '100%',
                height: 'auto'
            });
        }

        /**
         * @ngdoc method
         * @name jwShowcase.core.cookies#hide
         * @methodOf jwShowcase.core.cookies
         *
         * @description
         * Hide cookies popover.
         */
        function hide () {

            if (!popover) {
                return;
            }

            popover.remove();
            popover = null;
        }

        /**
         * @ngdoc method
         * @name jwShowcase.core.cookies#show
         * @methodOf jwShowcase.core.cookies
         *
         * @description
         * Show cookies popover.
         *
         * @param {string} message The message shown in the confirmation dialog.
         */
        function show () {

            var scope;

            // already shown
            if (popover) {
                return;
            }

            scope = $rootScope.$new();

            $controller('CookiesController as vm', {
                $scope:  scope,
                cookies: {
                    hide: hide
                }
            });

            popover = $ionicPopover
                .fromTemplate(template, {
                    scope:                   scope,
                    positionView:            positionView,
                    animation:               'cookies-animation',
                    hideDelay:               300,
                    backdropClickToClose:    false,
                    hardwareBackButtonClose: false
                });

            popover
                .show(document.body);
        }

        /**
         * @ngdoc method
         * @name jwShowcase.core.cookies#showIfNeeded
         * @methodOf jwShowcase.core.cookies
         *
         * @description
         * Show cookies popover if user has not accepted cookies and platform is not Cordova.
         */
        function showIfNeeded () {

            var isBrowser = !window.cordova;

            if (config.enableCookieNotice && !userSettings.settings.cookies && isBrowser) {
                show();
            }
        }
    }

}());
