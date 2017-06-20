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
        .directive('floatingLabel', floatingLabel);

    /**
     * @ngdoc directive
     * @name jwShowcase.core.directive:jwCollapsibleText
     * @module jwShowcase.core
     *
     * @param   {String} jwCollapsibleText      Default height of text (line height * max lines).
     * @param   {String} jwCollapsibleTextWatch Observe this value for changes.
     *
     * @requires jwShowcase.core.utils
     *
     * @example
     *
     * ```
     * <div jw-collapsible-text="3em">{{ vm.description }}</div>
     * ```
     */
    floatingLabel.$inject = ['utils'];
    function floatingLabel (utils) {

        return {
            restrict:         'A',
            link:             link
        };

        function link (scope, element, attrs) {
            var template = '<div class="jw-floating-label">' + attrs.placeholder +'</div>';

            //append floating label template
            element.after(template);

            //remove placeholder
            element.removeAttr('placeholder');


            scope.$watch(function () {
                if(element.val().toString().length < 1) {
                    element.addClass('jw-input-empty');
                } else {
                    element.removeClass('jw-input-empty');
                }
            });
        }
    }

}());

