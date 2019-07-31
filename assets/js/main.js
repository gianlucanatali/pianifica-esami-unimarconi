/*var x = document.getElementById("cdlSelect");
var option = document.createElement("option");
option.text = "Kiwi";
x.add(option, x[0]);
*/

var store;
var configObj;

$(function() {

    store = new Persist.Store('Pianifica Esami');
    configObjStored = store.get('configObj');
    if(configObjStored){
        configObj = JSON.parse(configObjStored);
    }else{
        configObj = {
            esamiPianificati: [],
            appelliScelti: [] 
        };
    }

    moment.locale('it'); 
    
    $('#esamiSelect').multiselect({
        maxHeight: 200,
        includeSelectAllOption: true
    });

    $("#searchBtn").click(function(){
        loadAppelli();
    }); 

    $( "#cdlSelect" ).change(function () {
        var selectedCdl = getSelectedCdl();
        configObj.cdl = selectedCdl;
        persistConfigObj();
        loadEsami();
    });

    jQuery.getJSON( "assets/json/corsi_laurea.json", function( data ) {
        var items = [];
        var selectedIndex=0;
        
        var x = document.getElementById("cdlSelect");
        $.each( data.data, function( key, val ) {
            var option = document.createElement("option");
            option.text = val.cdl;
            option.value = val.cdl;
            x.add(option, x[key]);
            if(configObj.cdl&&val.cdl===configObj.cdl){
                selectedIndex=key;
            }
        });   
        x.selectedIndex = selectedIndex;  
    });

    if(configObj.cdl){
        loadEsami();
    }
      
});

function getSelectedCdl(){
    var selectedCdl = "";
    selectedCdl= $('#cdlSelect').find(":selected").val()
    return selectedCdl;
}

function loadEsami() {
    var cdl = configObj.cdl;
    if(!cdl){return;}
    jQuery.getJSON( "assets/json/esami/"+cdl+"_esami.json", function( data ) {
        var items = [];
        $("#esamiSelect").empty();
        var x = document.getElementById("esamiSelect");
        $.each( data.data, function( key, val ) {
            if(val.cdl==cdl){
                var option = document.createElement("option");
                option.text = '('+val.ssd+') '+val.disciplina;
                if(configObj.selectedExams&&configObj.selectedExams.includes(val.id)){
                    option.selected='selected'
                }
                //option.text = val.id;
                option.value = val.id;
                x.add(option, x[key]);
            }
        });   
        $('#esamiSelect').multiselect('rebuild');
        if(configObj.selectedExams){
            loadAppelli();
        }

      });

}


function loadAppelli() {
    var cdl = configObj.cdl;
    var selectedExams = getSelectedExams();
    configObj.selectedExams = selectedExams;
    persistConfigObj();

    if(!cdl){return;}
    jQuery.getJSON( "assets/json/date_esami/"+cdl+"_date_esami.json", function( data ) {
        var tableArr= createTableHeader();
        var calEvents=[];

        $.each( data.data, function( key, val ) {
            if(selectedExams.includes(val.id)){
                if(configObj.appelliScelti.includes(JSON.stringify(val))){
                    addTableRow(tableArr[1],key,val);
                }
                if(!configObj.esamiPianificati.includes(val.ssd)
                    ||configObj.appelliScelti.includes(JSON.stringify(val))){

                    var event = getScheduleConfig(key,val);
                    if(event){
                        calEvents.push(event);
                    }
                }
                
            }
        });

        createTableFooter(tableArr[0]);
        sortTable();

        var inputs = $(".removeAppelloBtn");
        inputs.each(function(){ 
            $(this).click(function(){
                //console.log(this,$(this).attr('data-event'));
                rimuoviAppello(JSON.parse($(this).attr('data-event')));
            });
            //show expression (for debug)
        });

        var myCal=prepareCalendar(calEvents);

        setRenderRangeText(myCal);

        $("#todayBtn").click(function(){
            myCal.today();
            setRenderRangeText(myCal);
        }); 
        $("#prevBtn").click(function(){
            myCal.prev();
            setRenderRangeText(myCal);
        }); 
        $("#nextBtn").click(function(){
            myCal.next();
            setRenderRangeText(myCal);
        }); 

    });

}

function getSelectedExams(){
    var selected = [];
    $('#esamiSelect option:selected').each(function() {
        selected.push($(this).val());
    });
    return selected;
}

function getScheduleConfig(key,val){
    if(!val.data){return;}
    var hour=parseInt(val.orario.split(":")[0]);
    var minute=parseInt(val.orario.split(":")[1]);
    var examTime=moment(val.data, "YYYY/MM/DD HH:mm:ss").hour(hour).minutes(minute)
    return {
        "id": key,
        "calendarId": '1',
        "title": '('+val.ssd+') '+ val.disciplina,
        "body": JSON.stringify(val),
        "category": 'time',
        "dueDateClass": '',
        "start": examTime.toDate(),
        "end": '',
        "isReadOnly": true    // schedule is read-only*/
    }
}

function addTableRow($tbody,key,val){
    $tbody.append('<tr />').children('tr:last')
    .append("<td>"+val.cdl+"</td>")
    .append("<td>"+val.ssd+"</td>")
    .append("<td>"+val.disciplina+"</td>")
    .append("<td>"+val.docente+"</td>")
    .append("<td>"+formatDate(val.data)+"</td>")
    .append("<td>"+val.orario+"</td>")
    .append("<td class='noprint'><p class='removeAppelloBtn' data-event='"+JSON.stringify(val).replace("'","&#x27;")+"'>Rimuovi</p></td>");
    //return $body;
}

function createTableHeader(){

    // create table
    var $table = $('<table id="tableAppelli" class="blueTable">');
    // thead
    $table.append('<thead>').children('thead')
    .append('<tr />').children('tr').append('<th>CDL</th><th>SSD</th><th>Disciplina</th><th>Docente</th><th>Data</th><th>Orario</th><th class="noprint"></th>');

    //tbody
    var $tbody = $table.append('<tbody />').children('tbody');

    return [$table,$tbody];
}

function createTableFooter($table){

    $("#dynamicTable").empty();

    // add table to dom
    $table.appendTo('#dynamicTable');

}



function formatDate(date){
   
    if (date){
        return moment(date, "YYYY/MM/DD HH:mm:ss").format('LL');
    }else{
        return "N/D";
    }
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

function setRenderRangeText(cal) {
    var renderRange = document.getElementById('renderRange');
    var options = cal.getOptions();
    var viewName = cal.getViewName();
    var html = [];
    if (viewName === 'day') {
      html.push(moment(cal.getDate().getTime()).format('YYYY.MM.DD'));
    } else if (viewName === 'month' &&
      (!options.month.visibleWeeksCount || options.month.visibleWeeksCount > 4)) {
      html.push(moment(cal.getDate().getTime()).format('MMMM YYYY').capitalize());
    } else {
      html.push(moment(cal.getDateRangeStart().getTime()).format('YYYY.MM.DD'));
      html.push(' ~ ');
      html.push(moment(cal.getDateRangeEnd().getTime()).format(' MM.DD'));
    }
    renderRange.innerHTML = html.join('');
  }

function persistConfigObj(){
    var myJSON = JSON.stringify(configObj);
    store.set('configObj', myJSON);
}



function scegliAppello(appello){
    configObj.esamiPianificati.push(appello.ssd);
    configObj.appelliScelti.push(JSON.stringify(appello));
    persistConfigObj();
    loadAppelli();
}

function rimuoviAppello(appello){
    configObj.esamiPianificati.remove(appello.ssd);
    configObj.appelliScelti.remove(JSON.stringify(appello));
    persistConfigObj();
    loadAppelli();
}

function openDialog(e){
    var eventDetails = JSON.parse(e.schedule.body);
    var dialogConfig = {
        title: e.schedule.title,
        message: "<p>Data: "+moment(e.schedule.start.getTime()).format('LL')+"</p>"
                +"<p>Orario: "+eventDetails.orario+"</p>"
                +"<p>Docente: "+eventDetails.docente+"</p>",
        size: 'large',
        buttons: {
            
        }
    };
    if(!configObj.esamiPianificati.includes(eventDetails.ssd)){
        dialogConfig.buttons.ok = {
            label: "Scegli Appello",
            className: 'btn-info',
            callback: function(){
                scegliAppello(eventDetails)
            }
        }
    }else{
        dialogConfig.buttons.cancel = {
            label: "Rimuovi da Pianificati",
            className: 'btn-danger',
            callback: function(){
                rimuoviAppello(eventDetails)
            }
        }
    }
    var dialog = bootbox.dialog(dialogConfig);
    
}


function prepareCalendar(calEvents) {
    $("#calendar").empty();
    var calendar = new tui.Calendar(document.getElementById('calendar'), {
        defaultView: 'month',
        usageStatistics: false,
        useCreationPopup: false,
        useDetailPopup: false,
        disableClick: true,
        taskView: true
      });
      calendar.createSchedules(calEvents);

      // event handlers
      calendar.on({
            'clickSchedule': function(e) {
                console.log('clickSchedule', e);
                openDialog(e);
            }
      });
      return calendar;
    /*
    $('#calendar').tuiCalendar({
        defaultView: 'month',
        usageStatistics: false,
        taskView: true,
        
      }).createSchedules(calEvents);*/

}

Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

function sortTable() {
    var table, rows, switching, i, x, y, shouldSwitch;
    table = document.getElementById("tableAppelli");
    switching = true;
    /* Make a loop that will continue until
    no switching has been done: */
    while (switching) {
      // Start by saying: no switching is done:
      switching = false;
      rows = table.rows;
      /* Loop through all table rows (except the
      first, which contains table headers): */
      for (i = 1; i < (rows.length - 1); i++) {
        // Start by saying there should be no switching:
        shouldSwitch = false;
        /* Get the two elements you want to compare,
        one from current row and one from the next: */
        x = moment(rows[i].getElementsByTagName("TD")[4].innerHTML+" "+rows[i].getElementsByTagName("TD")[5].innerHTML,"DD MMMM YYYY HH:mm");
        y = moment(rows[i+1].getElementsByTagName("TD")[4].innerHTML+" "+rows[i+1].getElementsByTagName("TD")[5].innerHTML,"DD MMMM YYYY HH:mm");
        // Check if the two rows should switch place:
        if (x.isAfter(y)) {
          // If so, mark as a switch and break the loop:
          shouldSwitch = true;
          break;
        }
      }
      if (shouldSwitch) {
        /* If a switch has been marked, make the switch
        and mark that a switch has been done: */
        rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
        switching = true;
      }
    }
  }
