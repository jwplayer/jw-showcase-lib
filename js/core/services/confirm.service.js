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

    angular
        .module('jwShowcase.core')
        .service('confirm', confirm);

    /**
     * @ngdoc service
     * @name jwShowcase.core.confirm
     *
     * @requires $q
     * @required $ionicPopup
     */
    confirm.$inject = ['$q', '$ionicPopup'];
    function confirm ($q, $ionicPopup) {

        this.show = show;

        ////////////////

        /**
         * @ngdoc method
         * @name jwShowcase.core.confirm#show
         * @methodOf jwShowcase.core.confirm
         *
         * @description
         * Show confirmation modal with the given message.
         *
         * @param {string} message The message shown in the confirmation dialog.
         */
        function show (message) {

            var defer = $q.defer();

            $ionicPopup.show({
                cssClass: 'jw-dialog',
                template: message,
                buttons:  [{
                    text:  '<strong>Yes</strong>',
                    type:  'jw-button jw-button-primary',
                    onTap: function () {
                        defer.resolve();
                    }
                }, {
                    text: 'No',
                    type: 'jw-button jw-button-light',
                    onTap: function () {
                        defer.reject();
                    }
                }]
            });

            return defer.promise;
        }
    }

}());
