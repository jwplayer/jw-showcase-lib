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

(function() {

    angular
        .module('jwShowcase.core')
        .service('session', session);

    /**
     * @ngdoc service
     * @name jwShowcase.core.session
     */
    session.$inject = ['$firebaseObject', '$firebaseArray', 'auth', 'config'];
    function session($firebaseObject, $firebaseArray, auth, config) {

        var throttle, rerun;
        var db;

        this.save  = save;
        this.load  = load;
        this.watch = watch;
        this.clear = clear;

        if (config.options.firebase) {
            var database = auth.getIdentity().then(function(identity) {
                if (!identity) {
                    return;
                }

                db = firebase.database();

                return $firebaseObject(db.ref(identity.uid)).$loaded();
            });
        }
        ////////////////

        /**
         * @ngdoc method
         * @name jwShowcase.core.session#load
         * @methodOf jwShowcase.core.session
         *
         * @description
         * Get value from localStorage with the given key. Defaults to defaultValue.
         *
         * @param {string}  key             The key to load.
         * @param {*}       defaultValue    This value is returned when key does not exist.
         */
        function load(key, defaultValue) {
            return isLocal().then(function (local) {
                if (local) {
                    return loadLocal(key, defaultValue);
                }

                return database.then(function($db) {
                    return $db[key.replace(/^jwshowcase\./, '')];
                });
            });
        }

        function isLocal() {
            if (!config.options.firebase) {
                return Promise.resolve(true);
            }

            return auth.getIdentity().then(function (identity) {
                return !identity;
            }).catch(function () {
              return true;
            });
        }

        function loadLocal(key, defaultValue) {
            var value;

            if (!window.localStorageSupport) {
                return Promise.resolve(defaultValue);
            }

            value = window.localStorage.getItem(key);

            if (!angular.isDefined(value) || null == value) {
                return defaultValue;
            }

            if (angular.isString(value) && /^[{\[]/.test(value)) {
                try {
                    value = JSON.parse(value);
                }
                catch (e) {
                    value = defaultValue;
                }
            }

            return Promise.resolve(value);
        }

        function watch(key, callback, collection) {

            if (!config.options.firebase) {
                return;
            }

            auth.getIdentity().then(function(identity) {
                if (!identity) {
                    return;
                }

                database.then(function() {
                    var refPath = db.ref(identity.uid + '/' + key.replace(/^jwshowcase\./, ''));
                    var $ref;

                    if (collection) {
                        $ref = $firebaseArray(refPath);
                    } else {
                        $ref = $firebaseObject(refPath);
                    }

                    $ref.$watch(function() {
                        callback($ref);
                    });
                });
            });
        }

        function applyThrottle($db) {
            $db.$save();

            throttle = setTimeout(function() {
                if (rerun) {
                    rerun = false;

                    applyThrottle($db);
                } else {
                    throttle = null;
                }
            }, 10000);
        }

        /**
         * @ngdoc method
         * @name jwShowcase.core.session#save
         * @methodOf jwShowcase.core.session
         *
         * @description
         * Save value in localStorage with the given key.
         *
         * @param {string}  key      Key to identify the value.
         * @param {*}       value    Value to store.
         */
        function save(key, value, shouldThrottle) {
            return isLocal().then(function (local) {
                if (!local) {
                    return database.then(function($db) {
                        $db[key.replace(/^jwshowcase\./, '')] = value;

                        if (!shouldThrottle) {
                            clearTimeout(throttle);

                            throttle = null;
                            rerun = false;

                            return $db.save();
                        }

                        if (throttle) {
                            rerun = true;

                            return;
                        }

                        applyThrottle($db);
                    });
                }

                if (!window.localStorageSupport) {
                    return;
                }

                if (angular.isObject(value) || angular.isArray(value)) {

                    try {
                        value = JSON.stringify(value);
                    }
                    catch (e) {
                        // noop
                    }
                }

                window.localStorage.setItem(key, value);
            });
        }

        /**
         * @ngdoc method
         * @name jwShowcase.core.session#clear
         * @methodOf jwShowcase.core.session
         *
         * @description
         * Clears the given key from the localStorage.
         *
         * @param {string}  key             The key to clear.
         */
        function clear(key) {

            if (!window.localStorageSupport) {
                return;
            }

            window.localStorage.removeItem(key);
        }
    }

}());
