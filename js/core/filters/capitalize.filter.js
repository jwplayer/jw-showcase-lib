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
        .filter('capitalize', capitalize);

    /**
     * @ngdoc filter
     * @name jwShowcase.core.filter:capitalize
     * @module jwShowcase.core
     *
     * @description
     * Capitalize first letter of word
     */
    function capitalize() {
        return function (token) {
            return token.charAt(0).toUpperCase() + token.slice(1);
        };
    }

}());




