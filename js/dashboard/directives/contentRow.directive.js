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
    'use strict';

    angular
        .module('jwShowcase.dashboard')
        .directive('jwContentRow', jwContentRow);

    jwContentRow.$inject = ['$compile', '$templateCache'];

    function jwContentRow ($compile, $templateCache) {
        return {
            link:     link,
            restrict: 'E',
            scope:    {
                data:             '=',
                cardClickHandler: '='
            }
        };

        function link (scope, element, attrs) {

            var template   = $templateCache.get('views/dashboard/rows/' + scope.data.options.type + '.html');
            var childScope = scope.$new();

            childScope.feed             = scope.data.feed;
            childScope.options          = scope.data.options;
            childScope.cardClickHandler = scope.cardClickHandler;

            var html = $compile(template)(childScope);

            element.append(html);
        }
    }

})();

