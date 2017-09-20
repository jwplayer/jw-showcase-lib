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
        .service('notification', notificationService);

    /**
     * @ngdoc service
     * @name jwShowcase.core.notification
     *
     * @requires $q
     * @requires jwShowcase.config
     * @required jwShowcase.core.api
     * @required jwShowcase.core.dataStore
     */
    notificationService.$inject = ['$q', 'config', 'utils'];
    function notificationService ($q, config, utils) {
        this.checkPermission    = checkPermission;
        this.showNotification   = showNotification;
        this.subscribeUser      = subscribeUser;
        this.subscribeToServer  = subscribeToServer;
        this.swReady            = navigator.serviceWorker.ready;

        var self = this;

        /**
         * Check if notifications are allowed, or ask for permission if not asked yet
         * @returns {Promise}
         */
        function checkPermission() {
            var permission = Notification.permission;

            return new Promise(function (resolve, reject) {
                if (permission === 'granted') {
                    resolve();
                    return;
                }

                if (permission === 'denied') {
                    reject(
                        new Error('The user has previously denied permission for push notifications. Can\'t reprompt')
                    );
                    return;
                }

                Notification.requestPermission().then(function (permission) {
                    if (permission === 'granted') {
                        resolve();
                        return;
                    }

                    reject(
                        new Error('The user was prompted for permission to show notifications. User denied permission.')
                    );
                });
            });
        }

        /**
         * Show pwa notification
         * @param title
         * @param message
         */
        function showNotification(title, message) {
            checkPermission().then(function () {
                var options = {
                    body: message && message,
                    icon: 'images/logo.png',
                    dir: 'auto'
                };

                self.swReady.then(function (registration) {
                    registration.showNotification(title, options);
                });
            }).catch(function (err) {
                console.log(err);
            });
        }

        function subscribeUser() {
            return new Promise(function (resolve, reject) {
                var globalRegistration = null;

                self.swReady
                    .then(function (registration) {
                        globalRegistration = registration;
                        return registration.pushManager.getSubscription();
                    })
                    .then(function (subscription) {
                        if (subscription) {
                            resolve(subscription);
                            return;
                        }

                        var publicPushServerKey = config.options.notifications.publicPushServerKey;

                        globalRegistration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: utils.urlB64ToUint8Array(publicPushServerKey)
                        }).then(function (subscription) {
                            resolve(subscription);
                        }).catch(function (err) {
                            reject(err);
                        });
                    });

            });
        }

        function subscribeToServer(payload) {
            fetch(config.options.notifications.pushServerUrl + '/subscribe/',
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
        }
    }

}());
