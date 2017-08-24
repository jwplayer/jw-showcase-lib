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
     * @ngdoc overview
     * @name jwShowcase.login
     *
     * @description
     * Login module
     */
    angular
        .module('jwShowcase.login', [])
        .config(config);

    config.$inject = ['$stateProvider'];
    function config ($stateProvider) {

        $stateProvider.state('root.login', {
            url:         '/login',
            controller:  'LoginController as vm',
            templateUrl: 'views/core/popups/login.html',
            resolve:     {
                popupInstance: function () {
                    return {
                        close: function () {
                        },
                        isPage: function () {
                            return true;
                        }
                    };
                }
            }
        });
    }
}());
