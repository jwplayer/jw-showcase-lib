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
    SignupController.$inject = ['auth', 'popupInstance', 'popup', 'config', 'user'];
    function SignupController (auth, popupInstance, popup, config, user) {

        var vm = this;

        vm.providers = config.options.authenticationProviders;
        vm.termsAndConditions = config.options.termsAndConditions;

        vm.user = user;
        vm.errors = {};

        vm.signUp = signUp;
        vm.errorsPresent = errorsPresent;

        function signUp(email, password) {
            auth.firebaseAuth.$createUserWithEmailAndPassword(email, password)
                .then(function (firebaseUser) {

                    auth.firebaseAuth.$signOut();
                    firebaseUser.sendEmailVerification();

                    popup.alert('Thank you for signing up. We sent you an email to verify that you entered your ' +
                        'email address correctly. Please click the link in the email to verify your account.');

                    popupInstance.close(true);

                })
                .catch(function (error) {
                    vm.errors[error.code] = {message: error.message};
                });
        }

        function errorsPresent(obj) {
           return Object.keys(obj).length > 0;
        }

    }
}());
