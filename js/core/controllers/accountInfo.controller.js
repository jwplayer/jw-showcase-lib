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
        .controller('AccountInfoController', AccountInfoController);

    /**
     * @ngdoc controller
     * @name jwShowcase.core.AccountInfo
     *
     * @requires popupInstance
     */
    AccountInfoController.$inject = ['auth', 'popupInstance', 'popup', 'user', '$window'];
    function AccountInfoController (auth, popupInstance, popup, user, $window) {

        var vm = this;

        vm.user = user;
        vm.errors = {};

        vm.saveUser = saveUser;
        vm.deleteAccount = deleteAccount;
        vm.errorsPresent = errorsPresent;

        function saveUser(newPassword) {
            popupInstance.close(true);
            auth.firebaseAuth.$updatePassword(newPassword).then(function() {
                popup.alert('Password updated!');
            }).catch(function(error) {
                popup.alert('Password could not be updated');
            });
        }

        function deleteAccount() {
            popupInstance.close(true);
            popup.confirm('Are you sure you want to delete your account? Everything you have saved will be lost')
                .then(function (result) {
                    if (result) {
                        auth.firebaseAuth.$deleteUser()
                            .then(function() {
                                return popup.alert('Account deleted!');
                            })
                            .then(function() {
                                $window.location.reload();
                            })
                            .catch(function(error) {
                                popup.alert('Account could not be deleted. Try again later.');
                            });
                    }
                });
        }

        function errorsPresent(obj) {
            return Object.keys(obj).length > 0;
        }

    }

}());
