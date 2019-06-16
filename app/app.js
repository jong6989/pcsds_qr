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
    $scope.current_view = 'app/qr.html';
    $scope.html_title = "PCSDS QR Viewer";
    $scope.coordinates = {};
    $scope.system_message = "Some Error Occur.. Please Try Again";
    // $scope.is_geo_sent = false;
    $scope.is_data_valid = true;
    $scope.template = '';
    $scope.user_id = 0;
    $scope.is_loading = false;
    $scope.staff = $localStorage.pcsd_staff;

    $scope.valid_types = [
      { type : "ltp_rff" , template:'app/permits/ltp_rff.html' },
      { type : "ltp_ao12" , template:'app/permits/ltp_ao12.html' },
      { type : "wsup_rff" , template:'app/permits/wsup_rff.html' },
      { type : "wsup_ao12" , template:'app/permits/wsup_ao12.html'  },
      { type : "wcp" , template:'app/permits/wcp.html'  },
      { type : "wfp" , template:'app/permits/wfp.html'  },
      { type : "cr" , template:'app/permits/cr.html'  },
      { type : "ptp" , template:'app/permits/ptp.html'  }
    ];

    $scope.close_dialog = ()=> {
      $mdDialog.cancel();
    };
    
    $scope.open_action = (ev)=>{
      $mdDialog.show({
        contentElement: '#actionModal',
        parent: angular.element(document.body),
        targetEvent: ev,
        fullscreen: true,
        clickOutsideToClose: false
      });
    };

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
      return moment().format("YYYY-MM-DD HH:mm:ss");
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
      if(n==1)return "Received and under processing";
      if(n==2)return "Rejected";
      if(n==3)return "Processed and under review";
      if(n==4)return "Reviewed and for recommendation";
      if(n==5)return "Recomended and for approval";
      if(n==6)return "Approved, for release";
      if(n==7)return "Used";
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

    function notify_applicant(applicant_id,application_id,message){
      let notif = {
          "type" : "applicant",
          "user" : applicant_id,
          "transaction_id" : application_id,
          "message" : message,
          "status" : "0",
          "date" : Date.now()
      };
      fire.db.notifications.query.add(notif);
    }

    $scope.check_qr_code = ()=>{
      $scope.system_message = "Invalid QR Code!";
      if($location.search().type == undefined){return false;} 
      let return_val = false;
      $scope.valid_types.forEach(element => {
        if($location.search().type == element.type){
          $scope.is_loading = true;
          fire.db.transactions.when($location.search().id, (res) => {
            $scope.application = res;
            $scope.is_loading = false;
            $scope.$apply();
          });
          $scope.template = element.template;
          return_val = true;
        }
      });
      return return_val;
    };

    $scope.view_qr = ()=>{
      $scope.current_view = $scope.template;
    }

    $scope.load_html = (text,clas)=>{
      $timeout(
          ()=>{
              $("."+clas).html( text );
          },50
      )
    }

    $scope.extract_images_from_html = (clas,id,duration)=>{
      setTimeout(()=>{
        let obj = $("."+id);
        let hrefs = $("."+clas).children("a");
        let list = {};
        obj.empty();
        for (let index = 0; index < hrefs.length; index++) {
          let h = hrefs[index].href;
          if(!list[h]){
            let x = h.split('.');
            let t = x[x.length -1];
            if(t == 'jpg'|| t == 'png' || t == 'jpeg'){
              var img = new Image();
              img.src = hrefs[index].href;
              img.style = 'width:100%;height:auto';
              obj.append(img);
            }
            list[h] = true;
          }
        }
      },duration);
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

    $scope.mark_as_used = function(ev) {
      var confirm = $mdDialog.confirm()
          .title(`Mark this transaction number ${$scope.application.date} as used?`)
          .textContent('Please confirm your action')
          .ariaLabel('Mark as used')
          .targetEvent(ev)
          .ok('Mark as used')
          .cancel('Close');

      $mdDialog.show(confirm).then(function() {
        fire.db.transactions.update($scope.application.id,{
          "status":"7",
          "data.used" : {
              "staff" : $scope.staff.data.first_name + ' ' + $scope.staff.data.last_name,
              "date" : $scope.date_now(),
              "staff_id" : $scope.staff.id
          }
        });
        notify_applicant($scope.application.user.id,$scope.application.id,
            "Your permit where marked as used. Staff : " 
            + $scope.staff.data.first_name + ' ' 
            + $scope.staff.data.last_name);

        let act = `You mark as used transaction number ${$scope.application.date} of ${$scope.application.data.application.applicant} on ${$scope.to_date($scope.application.date)}.`;
        $scope.toast(act);
        fire.db.staffs.query.doc($scope.staff.id).collection("logs").add({name:"action",message:act,date:Date.now()});
      }, function() {
        console.log('closed');
      });
    };

    $scope.sign_out = () => {
      $localStorage.pcsd_staff = undefined;
      $scope.staff = undefined;
    };

    $scope.staff_login = function(id,pass){
      $scope.is_loading = true;
      var q = { 
        data : { 
          action : "user/login",
          id_number : id,
          key : pass
        },
        callBack : function(data){
          $scope.is_loading = false;
          if(data.data.status == 0){
            $scope.toast(data.data.error + "  : " + data.data.hint);
          }else {
            $localStorage.pcsd_staff = data.data.data.user;
            $scope.staff = data.data.data.user;
            fire.db.staffs.get(data.data.data.user.id, (res)=> {
              if(res == undefined) {
                fire.db.staffs.set(data.data.data.user.id, data.data.data.user);
              }
              $scope.staff = res;
              $scope.$apply();
            });
          }
        },
        errorCallBack : function(err){
          $scope.is_loading = false;
          console.log(err);
          $scope.toast("Connection error...");
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
      $scope.system_message = "";

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