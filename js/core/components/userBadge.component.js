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

    // DISCLAIMER: Example file. I know it's messy. Don't judge me.
    AuthController.$inject = ['auth', 'config', 'popup'];
    function AuthController(auth, config, popup) {
        var vm = this;
        vm.userBadgeClickHandler = userBadgeClickHandler;


        function userBadgeClickHandler (event) {

            popup.show({
                controller: 'LoginController as vm',
                templateUrl: 'views/core/popups/login.html'
            });
        }




        if(!config.options.useAuthentication) {
            return;
        }

        var firebaseAuth = auth.firebaseAuth;

        firebaseAuth.$onAuthStateChanged(function(firebaseUser) {
            vm.identity = firebaseUser ? firebaseUser : null;
        });

        this.logout = function() {
            firebaseAuth.$signOut();
        };

        this.login = function() {
            var credentials = collectCredentials();

            if (!credentials) {
                return;
            }

            firebaseAuth.$signInWithEmailAndPassword(credentials.email, credentials.password).then(function(user) {
                if (!user.emailVerified) {
                    alert('You have not verified your email address yet');

                    firebaseAuth.$signOut();
                }
            }).catch(console.error);
        };

        this.facebook = function() {
            firebaseAuth.$signInWithPopup('facebook')
                .then(function(firebaseUser) {
                    console.log('Signed in as:', firebaseUser.uid, firebaseUser);
                })
                .catch(function(error) {
                    console.log('Authentication failed:', error);
                });
        };

        this.signup = function() {
            var credentials = collectCredentials();

            if (!credentials) {
                return;
            }

            firebaseAuth.$createUserWithEmailAndPassword(credentials.email, credentials.password).then(function(user) {
                firebaseAuth.$signOut();
                user.sendEmailVerification();
            });
        };

        function collectCredentials() {

            var email = prompt('email');

            if (!/.*?@videodock\.com$/i.test(email)) {
                alert('invalid email');

                return null;
            }

            var password = prompt('password');

            return {email: email, password: password};
        }
    }
}());
