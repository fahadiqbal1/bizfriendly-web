var instructions = (function (instructions) {

  // private properties
  var debug = true;
  var bodyPadding = 0;
  var lessonId = 0; // Blank lesson
  var lesson = {};
  var steps = [];
  var step = {};
  var accessToken = null;
  var currentStep = 1;
  // var htcUrl = 'http://howtocity.herokuapp.com'
  var htcUrl = 'http://127.0.0.1:8000'
  var htcApiVer = '/api/v1'

  // PUBLIC METHODS

  // initialize variables and load JSON
  function init(){
    if (debug) console.log('init');
    // Get lessonId from the url
    lessonId = window.location.search.split('?')[1];
    // Call the API and get that lesson
    $.getJSON(htcUrl+htcApiVer+'/lessons/'+lessonId, _main);
  }

  // PRIVATE METHODS 
  function _orderSteps(){
    if (debug) console.log('ordering steps');
    steps = lesson.steps.sort(function(a, b){
      if (a.id < b.id) return -1;
      if (a.id > b.id) return 1;
      return 0;
    })
  }

  // Set steps to have javascript style names
  function _convertStepsAttributesNames(){
    if (debug) console.log('changing attribute names');
    var steps_with_js_names = [];
    $(steps).each(function(i){
      step = {
        id : steps[i].id,
        name : steps[i].name,
        stepType : steps[i].step_type,
        stepNumber : steps[i].step_number,
        stepText : steps[i].step_text,
        lessonId : steps[i].lesson_id,
        triggerEndpoint : steps[i].trigger_endpoint,
        triggerCheck : steps[i].trigger_check,
        triggerValue : steps[i].trigger_value,
        thingToRemember : steps[i].thing_to_remember,
        feedback : steps[i].feedback,
        nextStepNumber : steps[i].next_step_number
      }
      steps_with_js_names.push(step);
    })
    steps = steps_with_js_names;
  }

  // Set the steps state
  function _updateStepsStates(){
    if (debug) console.log('updating steps states');
    $(steps).each(function(i){
      if (currentStep == steps[i].stepNumber){
        steps[i].stepState = "active";
      }
      if (currentStep > steps[i].stepNumber){
        steps[i].stepState = "finished";
      }
      if (currentStep < steps[i].stepNumber){
        steps[i].stepState = "unfinished";
      }
    })
  }
  
  // Make progress bar
  function _makeProgressBar(){
    if (debug) console.log('making progress bar');
    $(steps).each(function(i){
      if (steps[i].stepNumber == currentStep){
        $('#progress').append('<li id="step'+steps[i].stepNumber+'_progress">'+steps[i].stepNumber+'</li>');
      }
      else{
        $('#progress').append('<li id="step'+steps[i].stepNumber+'_progress"></li>');
      }
    })
  }

  // Update the progress bar
  function _updateProgressBar(){
    if (debug) console.log('updating progress bar');
    $(steps).each(function(i){
      if (steps[i].stepState == 'active'){
        // $('#step'+steps[i].stepNumber+'_progress').removeClass('finished unfinished').addClass('active');
      $('#step'+steps[i].stepNumber+'_progress').html('<img src="img/active_dot.gif">');
      }
      if (steps[i].stepState == 'unfinished'){
        $('#step'+steps[i].stepNumber+'_progress').html('<img src="img/unfinished_dot.gif">');
      }
      if (steps[i].stepState == 'finished'){
        $('#step'+steps[i].stepNumber+'_progress').html('<img src="img/finished_dot.gif">');
      }
    })
  }

  // Show the current step
  function _showStep(){
    if (debug) console.log('showing step');
    $('section').attr('id','step'+steps[currentStep-1].stepNumber);
    $('section h2').html(steps[currentStep-1].name);
    $('.step_text').html(steps[currentStep-1].stepText);
    $('.feedback').html(steps[currentStep-1].feedback);
  }

  // next button is clicked
  function _nextClicked(evt){
    if (currentStep < steps.length){
      currentStep = currentStep + 1;
      if ($('.feedback').css('display') == 'block'){
        $('.feedback').toggle();
      }
      _updateStepsStates();
      _updateProgressBar();
      _showStep();
      _checkStep();
    }}

  // back button is clicked
  function _backClicked(evt){
    if (currentStep > 1){
      currentStep = currentStep - 1;
      _updateStepsStates();
      _updateProgressBar();
      _showStep();
      _checkStep();
    }
  }

  // 
  function _main(response){
    // Attach response to global lesson variable
    lesson = response;
    // Set the name of the lesson
    $('header h4').html(lesson.name);
    // Make sure steps are in order of id
    _orderSteps();
    // Convert python names to javascript names
    _convertStepsAttributesNames();
    // Initialize steps state
    _updateStepsStates();
    //Build progress bar
    _makeProgressBar();
    // Update progress Bar
    _updateProgressBar();
    // Show first step
    _showStep();
    // First step should have a login button
    $('#login').click(_loginClicked);
    // Adds button event handlers
    $('#back').click(_backClicked);
    $('#next').click(_nextClicked);
  }

  // login clicked
  function _loginClicked(){
    if (debug) console.log('login clicked');
    OAuth.initialize('uZPlfdN3A_QxVTWR2s9-A8NEyZs');
    OAuth.popup(lesson.url, function(error, result) {
      //handle error with error
      if (error) console.log(error);
      accessToken = result.access_token;
      // Check first step
      _checkStep();  
    });
  }

  // Check steps
  function _checkStep(){
    if (debug) console.log(steps[currentStep-1].name);
    // If step type is login
    if (steps[currentStep-1].stepType == 'login'){
      $.post(htcUrl+'/logged_in?access_token='+accessToken, steps[currentStep-1], _loggedIn);
    }
    // If step type is open
    if (steps[currentStep-1].stepType == 'open'){
      $(".open").click(_openClicked);
    }
    // If step type is check_for_new
    if (steps[currentStep-1].stepType == 'check_for_new'){
      $.post(htcUrl+'/check_for_new?access_token='+accessToken, steps[currentStep-1], _checkForNew);
    }
    // If step type is get_remembered_thing
    if (steps[currentStep-1].stepType == 'get_remembered_thing'){
      $.post(htcUrl+'/get_remembered_thing?access_token='+accessToken, steps[currentStep-1], _getRememberedThing);
    }
    // If step type is get_added_data
    if (steps[currentStep-1].stepType == 'get_added_data'){
      $.post(htcUrl+'/get_added_data?access_token='+accessToken, steps[currentStep-1], _getAddedData);
    }
    // If step type is choose_next_step
    if (steps[currentStep-1].stepType == 'choose_next_step'){
      $("#choice_one").click(_chooseNextStep);
      $("#choice_two").click(_chooseNextStep);
    }
  }

  // Are they logged in?
  function _loggedIn(response){
    if (response == 'TIMEOUT') _loggedIn();
    response = $.parseJSON(response);
    if (debug) console.log(response);
    if ( response.loggedIn ){
      $('#step'+step.stepNumber+' .feedback').css('display','block');
    }
  }

  // .open is clicked
  function _openClicked(evt){
    var challengeFeatures = {
      height: window.screen.height,
      width: 1000,
      name: 'challengeWindow',
      center: false
    }
    challengeWindow = $.popupWindow(step.triggerEndpoint, challengeFeatures);
    $('#step'+step.stepNumber+' .feedback').css('display','block');
  }

  function _checkForNew(response){
    if (response == 'TIMEOUT') _checkForNew();
    response = $.parseJSON(response);
    if ( response.newThingName ){
      if (debug) console.log(response);
      $('#step'+step.stepNumber+' .feedback .newThingName').html(response.newThingName);
      $('#step'+step.stepNumber+' .feedback').css('display','block');
    }
  }

  function _getRememberedThing(response){
    if (response == 'TIMEOUT') _getRememberedThing();
    response = $.parseJSON(response);
    if (debug) console.log(response);
    $('#step'+step.stepNumber+' .feedback .newData').html(response.newData);
    $('#step'+step.stepNumber+' .feedback').css('display','block');
  }

  function _getAddedData(response){
    if (response == 'TIMEOUT') _getAddedData();
    response = $.parseJSON(response);
    if (debug) console.log(response);
    // $('#step'+step.stepNumber+' .feedback .newData').attr('src',response.newData);
    $('#step'+step.stepNumber+' .feedback').css('display','block');
  }

  function _chooseNextStep(evt){
    if (debug) console.log(evt.target.id);
    choice = evt.target.id;
    $.post(htcUrl+'/choose_next_step?choice='+choice, step, _goToChosenStep);
  }

  function _goToChosenStep(response){
    if (debug) console.log(response);
    response = $.parseJSON(response);
    currentStep = parseInt(response.chosenStep);
    updateSteps(steps, currentStep);
    _checkStep();
  }

  // add public methods to the returned module and return it
  instructions.init = init;
  return instructions;
}(instructions || {}));

// initialize the module
instructions.init()