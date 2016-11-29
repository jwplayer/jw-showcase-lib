/**
 * Copyright 2015 Longtail Ad Solutions Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 **/

(function () {

    angular
        .module('jwShowcase.core')
        .directive('jwCard', cardDirective);

    /**
     * @ngdoc directive
     * @name jwShowcase.core.directive:jwCard
     * @module jwShowcase.core
     *
     * @description
     * # jwCard
     * The `jwCard` directive renders a playlist item. There are two possible styles available; 'default' or
     * 'featured'.
     *
     * @scope
     *
     * @param {jwShowcase.core.item}   item            Playlist item
     * @param {boolean=}        featured        Featured flag
     * @param {boolean=}        showTitle       Show item title when true
     * @param {boolean=}        showDescription Show item description when true
     * @param {function=}       onClick         Will be called when an click event occurs on the card.
     *
     * @example
     *
     * ```
     * <jw-card item="item" featured="false" show-title="true"></jw-card>
     * ```
     */
    cardDirective.$inject = ['$animate', '$q', '$timeout', '$templateCache'];
    function cardDirective ($animate, $q, $timeout, $templateCache) {

        return {
            scope:            {
                item:            '=',
                featured:        '=',
                showTitle:       '=',
                showDescription: '=',
                onClick:         '='
            },
            controllerAs:     'vm',
            controller:       'CardController',
            bindToController: true,
            replace:          true,
            templateUrl:      'views/core/card.html',
            link:             link
        };

        function link (scope, element) {

            scope.vm.showToast = showToast;

            /////////////

            /**
             * Show a toast over the card
             *
             * @param {Object} toast                Toast options object
             * @param {String} toast.templateUrl    Template url
             * @param {Number} [toast.duration]     Optional duration
             *
             * @returns {Promise}
             */
            function showToast (toast) {

                var defer         = $q.defer(),
                    html          = $templateCache.get(toast.templateUrl),
                    children      = element.children(),
                    toastsElement = angular.element(element[0].querySelector('.jw-card-toasts')),
                    toastElement  = angular.element(html);

                // add toast to card with enter animation
                $animate.enter(toastElement, toastsElement, children[children.length - 1]);

                // add class to card element
                element.addClass('jw-card-flag-toast-open');

                // set timeout to remove toast
                $timeout(function () {

                    $animate
                        .leave(toastElement)
                        .then(function () {
                            element.removeClass('jw-card-flag-toast-open');
                            defer.resolve();
                        });
                }, toast.duration || 1000);

                return defer.promise;
            }
        }
    }

}());
