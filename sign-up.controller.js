(function () {
    'use strict';

    /**
     * SignUp Object/function
     */
    function SignUpController($log, company, $q, $mdDialog, $state, sharedProperties) {

        $log = $log.getInstance('SignUpController', true);
        $log.debug("Loaded");

        //-> signUpC (view-model) is the object we bind to (this controller).
        var signUpC = this;

        ///////////////////////////////////////////////
        //-> ============= PRIVATE ================= //
        ///////////////////////////////////////////////

        var _name = 'SignUpController';

        /**
         * getName() - Private function
         */
        function _getName(val) {
            return _name;
        }

        ///////////////////////////////////////////////
        //-> ============= PUBLIC API ============== //
        ///////////////////////////////////////////////

        signUpC.getName = _getName;

        signUpC.visitor = new company();

        signUpC.visitor.categories = [];

        signUpC.visitor.betaParticipate = false;

        signUpC.emailExists = false;
        signUpC.generalEmail = false;
        signUpC.phoneValid = true;

        signUpC.emailRegEx = new RegExp('^([\\w.-]+)@(\\[(\\d{1,3}\\.){3}|(([a-zA-Z\\d-]+\\.)+))([a-zA-Z]{2,7}|\\d{1,3})(\\]?)$', 'i');
        signUpC.phoneRegEx = new RegExp('\\+(9[976]\\d|8[987530]\\d|6[987]\\d|5[90]\\d|42\\d|3[875]\\d|2[98654321]\\d|9[8543210]|8[6421]|6[6543210]|5[87654321]|4[987654310]|3[9643210]|2[70]|7|1)\\W*\\d\\W*\\d\\W*\\d\\W*\\d\\W*\\d\\W*\\d\\W*\\d\\W*\\d\\W*(\\d{1,2})(?:x.+)?$');
        signUpC.urlRegEx = new RegExp(
            "^" +
            // protocol identifier
            "(?:(https?|ftp)://)" +
            // user:pass authentication
            "(?:\\S+(?::\\S*)?@)?" +
            "(?:" +
            // IP address exclusion
            // private & local networks
            "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
            "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
            "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
            // IP address dotted notation octets
            // excludes loopback network 0.0.0.0
            // excludes reserved space >= 224.0.0.0
            // excludes network & broacast addresses
            // (first & last IP address of each class)
            "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
            "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
            "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
            "|" +
            // host name
            "(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)" +
            // domain name
            "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*" +
            // TLD identifier
            "(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))" +
            // TLD may end with dot
            "\\.?" +
            ")" +
            // port number
            "(?::\\d{2,5})?" +
            // resource path
            "(?:[/?#]\\S*)?" +
            "$", "i"
        );

        signUpC.emailDomainCheck = false;
        signUpC.signupSuccess = false;

        signUpC.visitor.querySearch = function (searchText) {
            var deferred = $q.defer();

            company.query({searchText: searchText}, function (response) {
                deferred.resolve(response.data);
            }, function (error) {
                deferred.resolve([]);
            });
            return deferred.promise;
        };

        signUpC.toggle = function (item) {
            var idx = signUpC.visitor.categories.indexOf(item);
            if (idx > -1) {
                if (item === 'Other') {
                    signUpC.otherEnabled = false;
                }
                signUpC.visitor.categories.splice(idx, 1);
            }
            else {
                signUpC.visitor.categories.push(item);
                if (item === 'Other') {
                    signUpC.otherEnabled = true;
                }
            }
        };

        signUpC.exists = function (item) {
            return signUpC.visitor.categories.indexOf(item) > -1;
        };

        signUpC.getFlexValue = function (index) {
            var val = index + 1;
            if (val === 3 || val === 7 || val === 11) {
                return "flex-30";
            } else if (val === 4 || val === 8 || val === 12) {
                return "flex-20";
            } else {
                return "flex-25";
            }
        };

        signUpC.signUpUser = function () {
			signUpC.visitor.phone = signUpC.visitor.phoneNumber;
            if(signUpC.visitor.phoneNumber && signUpC.visitor.ext) {
                signUpC.visitor.phone = signUpC.visitor.phoneNumber + ' ext. ' + signUpC.visitor.ext;
            }
            signUpC.visitor.company = signUpC.visitor.searchText;
            var idx = signUpC.visitor.categories.indexOf('Other');
            if (idx !== -1) {
                signUpC.visitor.categories[idx] = signUpC.visitor.otherCategory;
            }
            signUpC.signUpProcess = signUpC.visitor.$signUp(function (response) {
                signUpC.visitor = new company();
                signUpC.visitor.categories = [];
                signUpC.signupSuccess = true;
                signUpC.form.$setPristine();
                signUpC.form.$setUntouched();
                signUpC.emailExists = false;
                signUpC.generalEmail = false;
                signUpC.otherEnabled = false;
                signUpC.phoneValid = true;
                signUpC.alert = undefined;
                sharedProperties.setSubscriber({signedUp: true});
                var modalContent = "";
                var modalTitle = "";
                if (response.type === 'updated') {
                    if (response.verified) {
                        modalTitle = "Already Signed Up";
                        modalContent = "It seems you already signed up before. We have your registration details and will inform you when we have updates.";
                    } else {
                        modalTitle = "Signed up but not verified";
                        modalContent = 'It seems you already signed up before but not verified your email address. We have sent another email to your email address at <strong>' +
                            response.data.email + '</strong>. Please verify your registration by clicking on the link in your email. If you do not see an email from <a class="theme-color" href="mailto:noreply-validate@merlintech.com">noreply-validate@merlintech.com</a> then please check your spam folder.';
                    }

                } else {
                    modalTitle = "Signup Success";
                    modalContent = 'Thanks for signing up. A verification email has been sent to your email address at <strong>' +
                        response.data.email + '</strong>. Please verify your registration by clicking on the link in your email.';
                }

                signUpC.alert = $mdDialog.alert()
                    .clickOutsideToClose(true)
                    .title(modalTitle)
                    .htmlContent(modalContent)
                    .ariaLabel('Signup Success Dialog')
                    .theme('signup-box')
                    .ok('Ok');
                $mdDialog
                    .show(signUpC.alert)
                    .finally(function () {
                        signUpC.alert = undefined;
                        $state.go('merlinSite.home');
                    });

            }, function (error) {
                signUpC.signupSuccess = false;
            });
        };

        signUpC.checkPhoneExtension = function() {
            signUpC.visitor.ext = signUpC.visitor.ext.replace(/([^0-9|+])/g,'');
        };

        signUpC.formatInternational = function() {
            if(!signUpC.form.phoneNumber.$viewValue || signUpC.form.phoneNumber.$viewValue ==='') {
                signUpC.visitor.phone = '+';
            }
        };

        signUpC.clearPhone = function() {
            if(signUpC.form.phoneNumber.$viewValue==='+') {
                signUpC.visitor.phone = '';
            }
        };

        signUpC.validatePhone = function() {
            if(signUpC.visitor.phone) {
                signUpC.phoneValid = window.Inputmask.isValid(signUpC.visitor.phone, {alias: "phone"});
            } else {
                signUpC.phoneValid = true;
            }
        };

        signUpC.validateEmailAgainstUrl = function () {
            if(signUpC.form.website.$viewValue) {
                signUpC.visitor.url = (signUpC.form.website.$viewValue.indexOf('://') === -1) ? 'http://' + signUpC.form.website.$viewValue.toLowerCase() : signUpC.form.website.$viewValue.toLowerCase();
            }
        };

        signUpC.showConfirm = function (ev) {
            var parser = document.createElement('a');
            parser.href = signUpC.visitor.url;
            var domainName = parser.hostname.replace('www.', '');
            var rx = new RegExp("^.+@" + domainName + "$", 'i');
            if (!rx.test(signUpC.visitor.email) && signUpC.visitor.url) {
                var evt = document.getElementsByName('signUpC.form');
                var confirm = $mdDialog.confirm()
                    .title('Website URL does not match email domain.')
                    .textContent('Would you like to fix this or proceed with the submission anyways?')
                    .ariaLabel('Fix domain')
                    .theme('signup-box')
                    .targetEvent(ev)
                    .ok('Go Back to Edit')
                    .cancel('Submit Anyway');
                $mdDialog.show(confirm).then(function () {
                    angular.element('#subscriberEmail').focus();
                }, function () {
                    signUpC.signUpUser();
                });
            } else {
                signUpC.signUpUser();
            }
        };

        signUpC.checkEmailExists = function () {
            if (signUpC.visitor.email) {

                var generalEmailRegEx = new RegExp('^([\\w.-]+)@(\\[(\\d{1,3}\\.){3}|(?!gmail\.com|mail\.com|yahoo\.com|aol\.com|comcast\.net|rediffmail\.com|qq\.com)(([a-zA-Z\\d-]+\\.)+))([a-zA-Z]{2,7}|\\d{1,3})(\\]?)$', 'i');
                if (!generalEmailRegEx.test(signUpC.visitor.email)) {
                    signUpC.generalEmail = true;
                    return;
                } else {
                    signUpC.generalEmail = false;
                }

                company.checkEmail({email: signUpC.visitor.email}, function (response) {
                    signUpC.emailExists = true;
                }, function (error) {
                    signUpC.emailExists = false;
                });
            }
        };

    }

    //-> ANGULAR
    angular
        .module('merlinSite')
        .controller('signUpController', SignUpController);

})();
