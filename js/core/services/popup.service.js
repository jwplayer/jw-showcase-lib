/**
 * Copyright 2017 Longtail Ad Solutions Inc.
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
        .service('popup', popup);

    popup.$inject = ['$rootScope', '$q', '$controller', '$compile', '$templateCache'];
    function popup ($rootScope, $q, $controller, $compile, $templateCache) {

        var popups        = [],
            popupsElement = null;

        this.show = show;

        ////////////////

        /**
         * @name jwShowcase.core.popup.options
         * @type Object
         *
         * @property {string} templateUrl
         * @property {string} controller
         * @property {Object|HTMLElement} [target]
         * @property {string} [position]
         * @property {string} [className]
         * @property {Object} [resolve]
         */

        /**
         * Show a popup
         *
         * @param {jwShowcase.core.popup.options} options
         */
        function show (options) {

            var popup = createPopup(options);

            if (popup.element) {
                popups.unshift(popup);
                addPopupToView(popup);

                return popup.defer.promise;
            }

            $q.reject('failed to create popup');
        }

        /**
         * Ensure that the popups element is present
         */
        function ensurePopupsElement () {

            if (!popupsElement) {
                popupsElement = createPopupsElement();
                angular.element(document.body).append(popupsElement);
            }
        }

        /**
         * Add popup to view
         * @param {PopupInstance} instance
         */
        function addPopupToView (instance) {

            ensurePopupsElement();
            movePopupToTarget(instance);

            angular.element(popupsElement[0].querySelector('.jw-popups-container'))
                .append(instance.element);

            updatePopupsVisibility();
        }

        function movePopupToTarget (instance) {

            var target = instance.options.target,
                rect;

            if (!target) {
                return;
            }

            rect = target.getBoundingClientRect();

            instance.element.css({
                top:  rect.top + 'px',
                left: rect.left + 'px'
            });
        }

        /**
         * Remove popup from view
         * @param {PopupInstance} instance
         */
        function removePopupFromView (instance) {

            var index;

            if (instance) {

                index = popups.findIndex(function (curr) {
                    return curr === instance;
                });

                instance.element.remove();

                if (index > -1) {
                    popups.splice(index, 1);
                }
            }

            updatePopupsVisibility();
        }

        /**
         * Create a popup
         * @param {jwShowcase.core.popup.options} options
         * @returns {PopupInstance}
         */
        function createPopup (options) {

            options = options || {};

            var html     = $templateCache.get(options.templateUrl),
                scope    = $rootScope.$new(),
                instance = new PopupInstance(options),
                resolve  = angular.extend({$scope: scope, popupInstance: instance}, options.resolve);

            instance.element = $compile(html)(scope);

            if (options.controller) {
                $controller(options.controller, resolve);
            }

            return instance;
        }

        /**
         * Update the popups visibility
         */
        function updatePopupsVisibility () {

            popupsElement.toggleClass('ng-hide', popups.length === 0);
        }

        /**
         * Create the popups element
         * @returns {Object}
         */
        function createPopupsElement () {

            var html    = $templateCache.get('views/core/popups.html'),
                element = $compile(html)({});

            angular.element(element[0].querySelector('.jw-popups-backdrop'))
                .on('click', backdropClickHandler);

            return element;
        }

        /**
         * Handle backdrop click event
         * @param {Event} event
         */
        function backdropClickHandler (event) {

            closeMostTopPopup();

            event.preventDefault();
            event.stopImmediatePropagation();
        }

        /**
         * Close the most top popup
         */
        function closeMostTopPopup () {

            if (popups[0]) {
                popups[0].close();
            }
        }

        /**
         * PopupInstance constructor
         * @constructor
         */
        function PopupInstance (options) {

            var instance = this;

            this.options = options;

            this.element = null;

            this.defer = $q.defer();

            this.close = function (resolve) {
                removePopupFromView(instance);
                this.defer.resolve(resolve);
            };
        }
    }

}());
