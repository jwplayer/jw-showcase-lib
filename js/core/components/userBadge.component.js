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

(function() {

    /**
     * @ngdoc component
     * @name jwUserBadge
     * @module jwShowcase.core
     *
     * @description
     * Render the badge element.
     *
     * @example
     *
     * ```html
     * <jw-user-badge></jw-user-badge>
     * ```
     */
    angular
        .module('jwShowcase.core')
        .component('jwUserBadge', {
            controllerAs: 'vm',
            controller  : AuthController,
            templateUrl : 'views/core/userBadge.html'
        });

    AuthController.$inject = ['auth', 'config', 'popup'];
    function AuthController(auth, config, popup) {

        // Is triggered when useAuthentication in config is false
        if(!config.options.useAuthentication) {
            return;
        }

        var vm = this;
        vm.identity = null;
        vm.dropdownOpen = false;

        vm.userBadgeClickHandler = userBadgeClickHandler;
        vm.showAccountInfo = showAccountInfo;
        vm.logout = logout;

        auth.getIdentity().then(function (identity) {
           vm.identity = identity;
        });


        var firebaseAuth = auth.firebaseAuth;

        function userBadgeClickHandler (event) {
            if (vm.identity) {
                vm.dropdownOpen = !vm.dropdownOpen;
            } else {
                popup.show({
                    controller: 'LoginController as vm',
                    templateUrl: 'views/core/popups/login.html',
                    resolve: {
                        config: config
                    }
                });
            }

        }

        function showAccountInfo() {
            vm.dropdownOpen = false;
            popup.show({
                controller: 'AccountInfoController as vm',
                templateUrl: 'views/core/popups/accountInfo.html',
                resolve: {
                    user: vm.identity
                }

            });
        }

        function logout() {
            vm.dropdownOpen = false;
            auth.logout();
        }

        firebaseAuth.$onAuthStateChanged(function(firebaseUser) {
            vm.identity = firebaseUser ? firebaseUser : null;
        });
    }
}());
