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
        .controller('SignupController', SignupController);

    /**
     * @ngdoc controller
     * @name jwShowcase.core.SignupController
     *
     * @requires popupInstance
     */
    SignupController.$inject = ['auth', 'popupInstance', 'config'];
    function SignupController (auth, popupInstance, config) {

        var vm = this;

        vm.providers = config.options.authenticationProviders;

        vm.user = {};

        vm.errors = [];

        vm.signUp = signUp;
        vm.isPasswordTheSame = isPasswordTheSame;

        function signUp(email, password) {
            auth.firebaseAuth.$createUserWithEmailAndPassword(email, password)
                .then(function(firebaseUser) {
                    popupInstance.close(true);
                }).catch(function(error) {
                vm.errors.push(error);
            });
        }

        function isPasswordTheSame(password, secondPassword) {
            if (secondPassword && secondPassword.length > 0 && password !== secondPassword) {
                if(!vm.errors || !vm.errors[0] || vm.errors[0].message !== 'Passwords should be the same') {
                    vm.errors[0] = {message: 'Passwords should be the same'};
                }
            } else {
                vm.errors = [];
            }

            return password === secondPassword;
        }

    }

}());
