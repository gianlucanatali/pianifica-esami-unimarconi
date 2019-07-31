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

                addTableRow(tableArr[1],key,val);
                var event =getScheduleConfig(key,val);
                if(event){
                    calEvents.push(event);
                }
                
            }
        });

        createTableFooter(tableArr[0]);
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
        "body": 'Docente: '+val.docente,
        "category": 'time',
        "dueDateClass": '',
        "start": examTime.toDate(),
        "end": examTime.add(5,'hours').toDate(),
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
    .append("<td>"+val.orario+"</td>");
    //return $body;
}

function createTableHeader(){

    // create table
    var $table = $('<table class="blueTable">');
    // caption
    $table.append('<caption>MyTable</caption>')
    // thead
    .append('<thead>').children('thead')
    .append('<tr />').children('tr').append('<th>CDL</th><th>SSD</th><th>Disciplina</th><th>Docente</th><th>Data</th><th>Orario</th>');

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


function prepareCalendar(calEvents) {
    $("#calendar").empty();
    var calendar = new tui.Calendar(document.getElementById('calendar'), {
        defaultView: 'month',
        usageStatistics: false,
        useDetailPopup: true,
        disableClick: true,
        taskView: true/*,
        template: {
            monthGridHeader: function(model) {
              var date = new Date(model.date);
              var template = '<span class="tui-full-calendar-weekday-grid-date">' + date.getDate() + '</span>';
              return template;
            }
          }*/
      });
      calendar.createSchedules(calEvents);
      return calendar;
    /*
    $('#calendar').tuiCalendar({
        defaultView: 'month',
        usageStatistics: false,
        taskView: true,
        
      }).createSchedules(calEvents);*/

}