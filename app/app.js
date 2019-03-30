'use strict';

var myAppModule = angular.module('brain_app', ['ngMaterial','ngAnimate', 'ngMessages','ngFileUpload','ngImgCrop','ngStorage','ngRoute','camera'])

.factory("$utils",function($http, Upload,$filter){
   var f = {};
   f.api = function(q){
        $http.get(api_address, {params: q.data} )
          .then(function(data){
            if(q.callBack!==undefined) q.callBack(data);
          },function (data) {
                if(q.errorCallBack!==undefined)q.errorCallBack(data);
            }
          );
    };
   return f;
})

.controller('AppCtrl', function ($scope,$window,$filter, $http,$timeout, $interval, $mdSidenav, $log, $utils, $mdToast,$localStorage , $sessionStorage, $mdDialog,$route, $routeParams, $location) {
    $scope.api_address = api_address;
    $scope.current_view = 'app/landing.html';
    $scope.html_title = "PCSDS QR Viewer";
    $scope.coordinates = {};
    $scope.system_message = "Some Error Occur.. Please Try Again";
    // $scope.is_geo_sent = false;
    $scope.is_data_valid = true;
    $scope.template = '';
    $scope.user_id = 0;
    $scope.is_loading = false;
    $scope.valid_types = [{type:'ltp',template:'app/permits/ltp.html'}];

    
    $scope.to_date = function(d){
      return $filter('date')(d, "yyyy-MM-dd");
    };

    $scope.isOpenRight = function(){
      return $mdSidenav('right').isOpen();
    };

    $scope.date_gap = function(a,b){
      var a = moment(b);
      return a.from(a);
    };

    $scope.get_window_height = function(){
      return $(window).height();
    };

    $scope.printDiv = function (elementId) {
        var printContents = document.getElementById(elementId).innerHTML;
        var originalContents = document.body.innerHTML;      

        if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
            var popupWin = window.open('', '_blank', 'width=1200,height=500,scrollbars=no,menubar=no,toolbar=no,location=no,status=no,titlebar=no');
            popupWin.window.focus();
            popupWin.document.write('<!DOCTYPE html><html><head>' +
                '<link href="css/angular-material.min.css" rel="stylesheet">' +
                '<link href="plugins/bootstrap/4.1.1/bootstrap.min.css" rel="stylesheet"><style type="text/css"> .print-hide{display: none;} </style>' +
                '</head><body onload="window.print()"><div class="reward-body">' + printContents + '</div></html>');
            popupWin.onbeforeunload = function (event) {
                popupWin.close();
                return '.\n';
            };
            popupWin.onabort = function (event) {
                popupWin.document.close();
                popupWin.close();
            }
        } else {
            var popupWin = window.open('', '_blank', 'width=1200,height=500');
            popupWin.document.open();
            popupWin.document.write('<html><head><link href="css/angular-material.min.css" rel="stylesheet"><link href="plugins/bootstrap/4.1.1/bootstrap.min.css" rel="stylesheet">'+
              '<style type="text/css"> .print-hide{display: none;} </style></head><body onload="window.print()">' + printContents + '</html>');
            popupWin.document.close();
        }
        popupWin.document.close();

        return true;
    };

    $scope.date_from_now = function(a){
      var a = moment(a);
      return a.fromNow();
    };

    $scope.date_now = function(){
      return moment().format("YYYY-MM-DD");
    };

    $scope.toast = function(t){
      $mdToast.show(
        $mdToast.simple()
          .textContent(t)
          .hideDelay(4000)
      );
    };

    $scope.showPrerenderedDialog = function(ev,ID) {
      $mdDialog.show({
        contentElement: '#' + ID,
        parent: angular.element(document.body),
        targetEvent: ev,
        clickOutsideToClose: true
      });
    };

    $scope.iframeHeight = $scope.get_window_height();
    angular.element($window).bind('resize',function(){
      $scope.iframeHeight = $window.innerHeight;
      // $scope.$digest();
    });

    $scope.getStatusCode = function(n){
      if(n==0)return "Submitted";
      if(n==1)return "Received, Reviewing";
      if(n==2)return "Rejected";
      if(n==3)return "Accepted, On Process";
      if(n==4)return "Approved, On Process";
      if(n==5)return "Recomended, On Process";
      if(n==6)return "Acknowledged, Ready to Use";
    };

    $scope.alert = (title,text,event)=>{
      $mdDialog.show(
        $mdDialog.alert()
          .title(title)
          .textContent(text)
          .ariaLabel(title)
          .ok('close')
          .targetEvent(event)
      );
    }

    $scope.save_geolocation = (geo)=>{
      var q = { 
          data : {
              action : "database/geolocation/add",
              data : { latitude : geo.latitude, longitude : geo.longitude, params : $location.search() }
          }
      };
      $utils.api(q);
    };

    // $scope.get_single_transaction = (trans_id)=>{
    //   $http.get(api_address + "?action=applicant/transaction/qr&id=" + trans_id ).then(function(data){
    //     if(data.data.status==1 && data.data.data != 0){
    //       $scope.application = data.data.data;
    //     }else {
    //       $scope.system_message = "Invalid QR Code!";
    //       $scope.is_data_valid = false;
    //     }
    //   });
    // }

    $scope.check_qr_code = ()=>{
      $scope.system_message = "Invalid QR Code!";
      if($location.search().type == undefined){return false;} 
      let return_val = false;
      $scope.valid_types.forEach(element => {
        if($location.search().type == element.type){
          $scope.template = element.template;
          return_val = true;
        }
      });
      return return_val;
    };

    $scope.view_qr = ()=>{
      $scope.current_view = $scope.template;
    }

    $scope.enfocer_login = function(id,pass){
      var q = { 
          data : {
              action : "applicant/transaction/enforcer_qr",
              user_id : id,
              password : pass,
              transaction_id : $location.search().id
          },
          callBack : function(data){
              if(data.data.status == 0){
                $scope.system_message = data.data.error;
              }else {
                $scope.user_id = id;
                $scope.application = data.data.data;
                $scope.view_qr();
              }
          }
      };
      $utils.api(q);
    };

    $scope.mark_permit_as_used = function(r){
      $scope.is_loading = true;
      var q = { 
          data : {
              action : "applicant/transaction/used",
              user_id : $scope.user_id,
              remark : r,
              id : $location.search().id
          },
          callBack : function(data){
              $scope.is_loading = false;
              if(data.data.status == 1){
                $scope.application = data.data.data;
              }else {
                $scope.toast(data.data.error);
              }
          }
      };
      $utils.api(q);
    };

    //get geolocation
    $scope.get_geolocation = ()=>{
      if(!$scope.check_qr_code())
        return null;
      $scope.system_message = "Getting your location...";

      // $scope.get_single_transaction($location.search().id);
      $scope.system_message = "PCSD Enforcer Log-In";

      // if (navigator.geolocation) {
      //   navigator.geolocation.getCurrentPosition(
      //     (position)=>{
      //       $scope.coordinates = position.coords;
      //       // $scope.save_geolocation(position.coords);
      //       // $scope.is_geo_sent = true;
      //       $scope.get_single_transaction($location.search().id);
      //       $scope.system_message = "PCSD Enforcer Log-In";
      //     },
      //     (error)=>{
      //       switch(error.code) {
      //         case 1:
      //           $scope.system_message = "Location denied. Process terminated."
      //           break;
      //         case 2:
      //           $scope.system_message = "We Could not locate you. Process terminated"
      //           break;
      //         case 3:
      //           $scope.system_message = "Too long to respond. Process terminated."
      //           break;

      //         default :
      //           $scope.system_message = "An unknown error occurred. Please try again."
      //           break;
      //       }
      //       $scope.$apply();
      //     }
      //   );
      // } else { 
      //   $scope.system_message = "Geolocation is not supported by this browser.";
      // }
    };


})



;