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

    /**
     * @ngdoc component
     * @name jwSearch
     * @module jwShowcase.core
     *
     * @description
     * Render the search element.
     *
     * @example
     *
     * ```html
     * <jw-search></jw-search>
     * ```
     */
    angular
        .module('jwShowcase.core')
        .component('jwRail', {
            controllerAs: 'vm',
            controller:   RailController,
            templateUrl:  'views/core/rail.html',
            bindings: {
                playlist: '=',
                onItemClick: '&'
            }
        });

    /**
     * @ngdoc controller
     * @name jwShowcase.core.RailController
     *
     * @requires jwShowcase.config
     */
    RailController.$inject = ['config'];
    function RailController (config) {

        var vm        = this;

    }

}());
