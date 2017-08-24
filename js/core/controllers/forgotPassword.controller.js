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
        .controller('ForgotPasswordController', ForgotPasswordController);

    /**
     * @ngdoc controller
     * @name jwShowcase.core.ForgotPasswordController
     *
     * @requires auth
     * @requires popupInstance
     * @requires email
     * @requires popup
     */
    ForgotPasswordController.$inject = ['auth', 'popupInstance', 'email', 'popup'];
    function ForgotPasswordController (auth, popupInstance, email, popup) {
        var vm = this;

        vm.user = {
            email: email || null
        };

        vm.errors = [];
        vm.sendPasswordResetEmail = sendPasswordResetEmail;

        function sendPasswordResetEmail(email) {

            auth.firebaseAuth.$sendPasswordResetEmail(email).then(function () {
                popup.alert('An email has been sent to your email address to reset your password');
                popupInstance.close(true);
            }).catch(function (error) {
                vm.errors = [];
                vm.errors.push({message: error.message});
            });

        }
    }
}());
