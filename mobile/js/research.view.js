/*jshint debug:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, undef:true, curly:true, browser: true, devel: true, jquery:true, strict:false */
/*global Backbone, _, jQuery, Sail, google */

(function() {
  "use strict";
  var Skeletor = this.Skeletor || {};
  this.Skeletor.Mobile = this.Skeletor.Mobile || {};
  var app = this.Skeletor.Mobile;
  var Model = this.Skeletor.Model;
  Skeletor.Model = Model;
  app.View = {};
  var MAX_FILE_SIZE = 20971520;


  /**
   ** Note View
   **/
  app.View.Note = Backbone.View.extend({
    textTemplate: "#text-note-template",
    photoTemplate: "#photo-note-template",
    videoTemplate: "#video-note-template",

    events: {
      'click' : 'editNote'
    },

    initialize: function () {
      var view = this;

      view.model.on('change', function () {
        view.render();
      });

      return view;
    },

    editNote: function(ev) {
      var view = this;

      app.hideAllContainers();

      app.notesWriteView.model = view.model;
      jQuery('#notes-write-screen').removeClass('hidden');
      app.notesWriteView.render();
    },

    render: function () {
      var view = this,
          note = view.model,
          noteType,
          firstMediaUrl,
          listItemTemplate,
          listItem;

      // determine what kind of note this is, ie what kind of template do we want to use
      if (note.get('media').length === 0) {
        noteType = "text";
      } else if (note.get('media').length > 0) {
        firstMediaUrl = note.get('media')[0];
        if (app.photoOrVideo(firstMediaUrl) === "photo") {
          noteType = "photo";
        } else if (app.photoOrVideo(firstMediaUrl) === "video") {
          noteType = "video";
        } else {
          jQuery().toastmessage('showErrorToast', "You have uploaded a file that is not a supported file type! How did you manage to sneak it in there? Talk to Colin to resolve the issue...");
        }
      } else {
        throw "Unknown note type!";
      }

      if (noteType === "text") {
        //if class is not set do it
        if (!view.$el.hasClass('note-container')) {
          view.$el.addClass('note-container');
        }
        listItemTemplate = _.template(jQuery(view.textTemplate).text());
        listItem = listItemTemplate({ 'id': note.get('_id'), 'title': note.get('title'), 'body': note.get('body'), 'author': '- '+note.get('author') });
      } else if (noteType === "photo") {
        // if class is not set do it
        if (!view.$el.hasClass('photo-note-container')) {
          view.$el.addClass('photo-note-container');
        }
        listItemTemplate = _.template(jQuery(view.photoTemplate).text());
        listItem = listItemTemplate({ 'id': note.get('_id'), 'title': note.get('title'), 'url': app.config.pikachu.url + firstMediaUrl, 'author': '- '+note.get('author') });
      } else if (noteType === "video") {
        // if class is not set do it
        if (!view.$el.hasClass('video-note-container')) {
          view.$el.addClass('video-note-container');
        }
        listItemTemplate = _.template(jQuery(view.videoTemplate).text());
        listItem = listItemTemplate({ 'id': note.get('_id'), 'title': note.get('title'), 'url': app.config.pikachu.url + firstMediaUrl, 'author': '- '+note.get('author') });
      }
      else {
        throw "Unknown note type!";
      }

      // add the myNote class if needed
      if (note.get('note_type_tag') === "Big Idea") {
        view.$el.addClass('classNote');

      } else if (note.get('author') === app.username) {
        view.$el.addClass('myNote');
      }

      // Add the newly generated DOM elements to the views's part of the DOM
      view.$el.html(listItem);

      return view;
    }
  });

  /**
   ** NOTES VIEWS
   **/

  /**
    NotesReadView
  **/
  app.View.NotesReadView = Backbone.View.extend({
    initialize: function () {
      var view = this;
      console.log('Initializing NotesReadView...', view.el);

      /* We should not have to listen to change on collection but on add. However, due to wakefulness
      ** and published false first we would see the element with add and see it getting created. Also not sure
      ** how delete would do and so on.
      ** IMPORTANT: in addOne we check if the id of the model to be added exists in the DOM and only add it to the DOM if it is new
      */
      view.collection.on('change', function(n) {
        if (n.get('published') === true) {
          view.addOne(n);
        }
      });

      /*
      ** See above, but mostly we would want add and change in the note view. But due to wakeness and published flag
      ** we are better off with using change and filtering to react only if published true.
      ** IMPORTANT: in addOne we check that id isn't already in the DOM
      */
      view.collection.on('add', function(n) {
        // If the add fires while project not chosen yet we get an error
        if (n.get('published') === true) {
          view.addOne(n);
        }
      });

      return view;
    },

    events: {
      'click #nav-write-btn' : 'createNote'
    },

    createNote: function(ev) {
      var view = this;
      var m;

      // check if we need to resume
      // BIG NB! We use author here! This is the only place where we care about app.username (we want you only to be able to resume your own notes)
      var noteToResume = view.collection.findWhere({author: app.username, published: false});

      if (noteToResume) {
        // RESUME NOTE
        console.log("Resuming...");
        m = noteToResume;
      } else {
        // NEW NOTE
        console.log("Starting a new note...");
        m = new Model.Note();
        m.set('author', app.username);
        m.set('note_type_tag', "Note Type");        // set to the default
        m.wake(app.config.wakeful.url);
        m.save();
        view.collection.add(m);
      }

      app.notesWriteView.model = m;
      app.notesWriteView.model.wake(app.config.wakeful.url);

      app.hideAllContainers();
      jQuery('#notes-write-screen').removeClass('hidden');
      app.notesWriteView.render();
    },

    // switchToPosterView: function() {
    //   // jQuery().toastmessage('showErrorToast', "It is not time for this yet, kids");
    //   app.hideAllContainers();
    //   // if there's a poster for this project already, go to chunk screen, else go to new poster screen
    //   if (app.project.get('poster_title') && app.project.get('poster_title').length > 0) {
    //     app.projectPosterChunkView.render();
    //     jQuery('#project-poster-chunk-screen').removeClass('hidden');
    //   } else {
    //     app.projectNewPosterView.render();
    //     jQuery('#project-new-poster-screen').removeClass('hidden');
    //   }
    // },

    addOne: function(noteModel) {
      var view = this;

      // check if the note already exists
      // http://stackoverflow.com/questions/4191386/jquery-how-to-find-an-element-based-on-a-data-attribute-value
      if (view.$el.find("[data-id='" + noteModel.id + "']").length === 0 ) {
        // wake up the project model
        noteModel.wake(app.config.wakeful.url);

        // This is necessary to avoid Backbone putting all HTML into an empty div tag
        var noteContainer = noteContainer = jQuery('<li class="note-container col-xs-12 col-sm-4 col-lg-3" data-id="'+noteModel.id+'"></li>');

        var noteView = new app.View.Note({el: noteContainer, model: noteModel});
        var listToAddTo = view.$el.find('.notes-list');
        listToAddTo.prepend(noteView.render().el);
      } else {
        console.log("The note with id <"+noteModel.id+"> wasn't added since it already exists in the DOM");
      }
    },

    render: function() {
      var view = this;
      console.log("Rendering NotesReadView...");

      // sort newest to oldest (prepend!)
      view.collection.comparator = function(model) {
        return model.get('created_at');
      };

      var myPublishedNotes = view.collection.sort().where({published: true});

      // clear the house
      view.$el.find('.notes-list').html("");

      myPublishedNotes.forEach(function (note) {
        view.addOne(note);
      });
    }
  });


  /**
    NotesWriteView
  **/
  app.View.NotesWriteView = Backbone.View.extend({
    initialize: function() {
      var view = this;
      console.log('Initializing NotesWriteView...', view.el);
    },

    events: {
      'click .nav-read-btn'               : 'switchToReadView',
      // 'click .cancel-note-btn'            : 'cancelNote',
      'change .note-type-selector'        : 'updateNoteType',         // TODO: confirm this binding doens't leak out of this view
      'change #photo-file'                : 'uploadMedia',
      'click .remove-btn'                 : 'removeOneMedia',
      'click .publish-note-btn'           : 'publishNote',
      'click #lightbulb-icon'             : 'showSentenceStarters',
      'click .sentence-starter'           : 'appendSentenceStarter',
      'click .photo-container'            : 'openPhotoModal',
      'keyup :input'                      : 'checkForAutoSave'
    },

    updateNoteType: function(ev) {
      var view = this;
      var noteType = jQuery('#notes-write-screen .note-type-selector :selected').val();
      view.model.set('note_type_tag', noteType);

      // use this to populate the dropdown as well?
      // put this in mongo at some point (and add to readme)
      var sentenceStarters = {
        "Species": ["We wonder...","We just found out that...","Something that doesn't make sense is...","We conclude that..."],
        "Relationships": ["Rel1...","Rel2...","Rel3...","Rel4..."]
      };
      jQuery('#sentence-starter-modal .modal-body').html('');
      if (sentenceStarters[noteType]) {
        _.each(sentenceStarters[noteType], function(s) {
          jQuery('#sentence-starter-modal .modal-body').append('<div><button class="btn sentence-starter">'+s+'</button></div>');
        });
      } else {
        console.error('No sentence starters for this note type!');
      }
    },

    showSentenceStarters: function() {
      jQuery('#sentence-starter-modal').modal({keyboard: true, backdrop: true});
    },

    openPhotoModal: function(ev) {
      var view = this;
      var url = jQuery(ev.target).attr('src');
      //the fileName isn't working for unknown reasons - so we can't add metadata to the photo file name, or make them more human readable. Also probably doesn't need the app.parseExtension(url)
      //var fileName = view.model.get('author') + '_' + view.model.get('title').slice(0,8) + '.' + app.parseExtension(url);
      jQuery('#photo-modal .photo-content').attr('src', url);
      jQuery('#photo-modal .download-photo-btn a').attr('href',url);
      //jQuery('#photo-modal .download-photo-btn a').attr('download',fileName);
      jQuery('#photo-modal').modal({keyboard: true, backdrop: true});
    },

    appendSentenceStarter: function(ev) {
      // add the sentence starter text to the current body (note that this won't start the autoSave trigger)
      var bodyText = jQuery('#note-body-input').val();
      bodyText += jQuery(ev.target).text();
      jQuery('#note-body-input').val(bodyText);

      jQuery('#sentence-starter-modal').modal('hide');
    },

    uploadMedia: function() {
      var view = this;

      var file = jQuery('#photo-file')[0].files.item(0);
      var formData = new FormData();
      formData.append('file', file);

      if (file.size < MAX_FILE_SIZE) {
        jQuery('#photo-upload-spinner').removeClass('hidden');
        jQuery('.upload-icon').addClass('invisible');
        jQuery('.publish-note-btn').addClass('disabled');

        jQuery.ajax({
          url: app.config.pikachu.url,
          type: 'POST',
          success: success,
          error: failure,
          data: formData,
          cache: false,
          contentType: false,
          processData: false
        });
      } else {
        jQuery().toastmessage('showErrorToast', "Max file size of 20MB exceeded");
        jQuery('.upload-icon').val('');
      }

      function failure(err) {
        jQuery('#photo-upload-spinner').addClass('hidden');
        jQuery('.upload-icon').removeClass('invisible');
        jQuery('.publish-note-btn').removeClass('disabled');
        jQuery().toastmessage('showErrorToast', "Photo could not be uploaded. Please try again");
      }

      function success(data, status, xhr) {
        jQuery('#photo-upload-spinner').addClass('hidden');
        jQuery('.upload-icon').removeClass('invisible');
        jQuery('.publish-note-btn').removeClass('disabled');
        console.log("UPLOAD SUCCEEDED!");
        console.log(xhr.getAllResponseHeaders());

        // clear out the label value if they for some reason want to upload the same thing...
        jQuery('.upload-icon').val('');

        // update the model
        var mediaArray = view.model.get('media');
        mediaArray.push(data.url);
        view.model.set('media', mediaArray);
        view.model.save();
        // update the view (TODO: bind this to an add event, eg do it right)
        view.appendOneMedia(data.url);
      }

    },

    checkForAutoSave: function(ev) {
      var view = this,
          field = ev.target.name,
          input = ev.target.value;
      // clear timer on keyup so that a save doesn't happen while typing
      app.clearAutoSaveTimer();

      // save after 10 keystrokes
      app.autoSave(view.model, field, input, false);

      // setting up a timer so that if we stop typing we save stuff after 5 seconds
      app.autoSaveTimer = setTimeout(function(){
        app.autoSave(view.model, field, input, true);
      }, 5000);
    },

    // destroy a model, if there's something to destroy
    // cancelNote: function() {
    //   var view = this;

    //   // if there is a note
    //   if (view.model) {
    //     // confirm delete
    //     if (confirm("Are you sure you want to delete this note?")) {
    //       app.clearAutoSaveTimer();
    //       view.model.destroy();
    //       // and we need to set it to null to 'remove' it from the local collection
    //       view.model = null;
    //       jQuery('.input-field').val('');
    //       view.switchToReadView();
    //     }
    //   }
    // },

    publishNote: function() {
      var view = this;
      var title = jQuery('#note-title-input').val();
      var body = jQuery('#note-body-input').val();
      var noteType = jQuery('#notes-write-screen .note-type-selector :selected').val();

      // TODO: check if dropdowns are satisfied
      if (title.length > 0 && body.length > 0 && noteType !== "Note Type") {
        app.clearAutoSaveTimer();
        // if (noteType === "Big Idea") {
        //   view.model.set('author',"Class Note");
        // }
        view.model.set('title',title);
        view.model.set('body',body);
        view.model.set('published', true);
        // TODO: make these reflect dropdowns, species, etc
        view.model.set('habitat_tag', 1);
        view.model.set('species_tags', "this will be an array");
        view.model.set('modified_at', new Date());
        view.model.save();
        jQuery().toastmessage('showSuccessToast', "Published to the note wall!");

        view.switchToReadView();

        // TODO: clear the other fields (dropdowns, media)?
        view.model = null;
        jQuery('.input-field').val('');
      } else {
        // TODO: append for dropdowns
        jQuery().toastmessage('showErrorToast', "You must complete both fields and select a note type to submit your note...");
      }
    },

    switchToReadView: function() {
      var view = this;
      app.hideAllContainers();
      jQuery('#notes-read-screen').removeClass('hidden');
      // needs to unlock on back button as well
      if (view.model.get('note_type_tag') === "Big Idea" && view.model.get('write_lock') === app.username) {
        view.model.set('write_lock', "");
        view.model.set('author','Class Note');
        view.model.save();
      }
    },

    // TODO: this can be done more cleanly/backbonely with views for the media containers
    appendOneMedia: function(url) {
      var el;

      if (app.photoOrVideo(url) === "photo") {
        el = '<span class="media-container" data-url="'+url+'"><img src="'+app.config.pikachu.url+url+'" class="media photo-container img-responsive"></img><i class="fa fa-times fa-2x remove-btn editable" data-url="'+url+'"/></span>';
      } else if (app.photoOrVideo(url) === "video") {
        el = '<span class="media-container" data-url="'+url+'"><video src="' + app.config.pikachu.url+url + '" class="camera-icon img-responsive" controls /><i class="fa fa-times fa-2x remove-btn editable" data-url="'+url+'"/></span>';
      } else {
        el = '<img src="img/camera_icon.png" class="media img-responsive" alt="camera icon" />';
        throw "Error trying to append media - unknown media type!";
      }
      jQuery('#note-media-container').append(el);

      // one lightweight way of doing captions for this wallcology
      var noteBodyText = jQuery('#note-body-input').val();
      jQuery('#note-body-input').val(noteBodyText + '\n\nMedia caption: ');
    },

    removeOneMedia: function(ev) {
      var view = this;
      var targetUrl = jQuery(ev.target).data('url');
      var mediaArray = view.model.get('media');
      _.each(mediaArray, function(url, i) {
        if (mediaArray[i] === targetUrl) {
          mediaArray.pop(mediaArray[i]);
        }
      });
      view.model.set('media', mediaArray);
      view.model.save();

      jQuery('.media-container[data-url="'+targetUrl+'"]').remove();
      // clearing this out so the change event for this can be used (eg if they upload the same thing)
      jQuery('.upload-icon').val('');
    },

    render: function () {
      var view = this;
      console.log("Rendering NotesWriteView...");

      jQuery('#notes-write-screen .note-type-selector').val(view.model.get('note_type_tag'));
      jQuery('#note-title-input').val(view.model.get('title'));
      jQuery('#note-body-input').val(view.model.get('body'));
      // TODO: add in dropdowns
      jQuery('#note-media-container').html('');
      view.model.get('media').forEach(function(url) {
        view.appendOneMedia(url);
      });

      // check is this user is allowed to edit this note
      if (view.model.get('author') === app.username || (view.model.get('note_type_tag') === "Big Idea" && view.model.get('write_lock') === "")) {
        jQuery('#notes-write-screen .editable.input-field').removeClass('uneditable');
        jQuery('#notes-write-screen .editable').removeClass('disabled');
        if (view.model.get('note_type_tag') === "Big Idea") {
          view.model.set('write_lock', app.username);
          view.model.set('author', app.users.findWhere({username: app.username}).get('display_name')+' is editing...');
          view.model.save();
        }
      } else {
        jQuery('#notes-write-screen .editable.input-field').addClass('uneditable');
        jQuery('#notes-write-screen .editable').addClass('disabled');
      }
    }
  });


/**
  NewProjectView
**/
// app.View.NewProjectView = Backbone.View.extend({

//   initialize: function () {
//     var view = this;
//     console.log('Initializing NewProjectView...', view.el);
//   },

//   events: {
//     'click #submit-partners-btn' : 'addPartnersToProject',
//     'click .project-theme-button': 'addThemeToProject'
//   },

//   addPartnersToProject: function() {
//     var view = this;

//     // put all selecteds into the project
//     var partners = [];
//     _.each(jQuery('.selected'), function(b) {
//       partners.push(jQuery(b).val());
//     });
//     app.project.set('associated_users',partners);
//     app.project.save();

//     // move to the next screen
//     jQuery('#new-project-student-picker').addClass('hidden');
//     jQuery('#new-project-theme-picker').removeClass('hidden');
//   },

//   addThemeToProject: function(ev) {
//     var view = this;

//     app.project.set('theme',jQuery(ev.target).val());
//     app.project.save();

//     jQuery().toastmessage('showSuccessToast', "You have created a new project!");

//     // complete the newProject section and move to proposal section
//     jQuery('#new-project-theme-picker').addClass('hidden');
//     jQuery('#proposal-screen').removeClass('hidden');
//     jQuery('#proposal-nav-btn').addClass('active');
//   },

//   render: function () {
//     var view = this;
//     console.log("Rendering NewProjectView...");

//     // ADD THE USERS
//     jQuery('.project-partner-holder').html('');
//     if (app.users.length > 0) {
//       // sort the collection by username
//       app.users.comparator = function(model) {
//         return model.get('display_name');
//       };
//       app.users.sort();

//       app.users.each(function(user) {
//         var button = jQuery('<button class="btn project-partner-button btn-default btn-base">');
//         button.val(user.get('username'));
//         button.text(user.get('display_name'));
//         jQuery('.project-partner-holder').append(button);

//         // add the logged in user to the project
//         if (user.get('username') === app.username) {
//           button.addClass('selected');
//           button.addClass('disabled');
//         }
//       });

//       //register click listeners
//       jQuery('.project-partner-button').click(function() {
//         jQuery(this).toggleClass('selected');
//       });
//     } else {
//       console.warn('Users collection is empty!');
//     }

//     // ADD THE THEMES AKA TAGS
//     jQuery('.project-theme-holder').html('');
//     if (Skeletor.Model.awake.tags.length > 0) {
//       Skeletor.Model.awake.tags.each(function(tag) {
//         var button = jQuery('<button class="btn project-theme-button btn-default btn-base">');
//         button.val(tag.get('name'));
//         button.text(tag.get('name'));
//         jQuery('.project-theme-holder').append(button);
//       });
//     } else {
//       console.warn('Tags collection is empty!');
//     }
//   }

// });


/**
  ProposalsView
**/
// app.View.ProposalsView = Backbone.View.extend({

//   initialize: function () {
//     var view = this;
//     console.log('Initializing ProposalsView...', view.el);

//     view.collection.on('change', function(n) {
//       if (n.id === app.project.id) {
//         view.render();
//       }
//     });
//   },

//   events: {
//     'click #publish-proposal-btn' : 'publishProposal',
//     'click .nav-splash-btn'       : 'switchToSplashView',
//     'keyup :input'                : 'checkForAutoSave'
//   },

//   switchToSplashView: function() {
//     app.resetToSplashScreen();
//   },

//   publishProposal: function() {
//     var view = this;
//     var name = jQuery('#proposal-screen [name=name]').val();

//     if (name.length > 0) {
//       var researchQuestionVal = jQuery('#proposal-screen [name=research_question]').val();
//       var needToKnowsVal = jQuery('#proposal-screen [name=need_to_knows]').val();

//       app.clearAutoSaveTimer();
//       app.project.set('name',name);
//       var proposal = app.project.get('proposal');
//       proposal.research_question = researchQuestionVal;
//       proposal.need_to_knows = needToKnowsVal;
//       proposal.published = true;
//       app.project.set('proposal',proposal);
//       app.project.save();

//       // show who is 'logged in' as the group, since that's our 'user' in this case
//       app.groupname = name;
//       jQuery('.username-display a').text(app.groupname);

//       // delete all previous proposal tiles for this project
//       // Skeletor.Model.awake.tiles.where({ 'project_id': app.project.id, 'from_proposal': true }).forEach(function(tile) {
//       //   tile.destroy();
//       // });

//       // create the new proposal tiles
//       view.createProposalNote("Foundational knowledge", needToKnowsVal);
//       view.createProposalNote("Research question(s)", researchQuestionVal);

//       jQuery().toastmessage('showSuccessToast', "Your proposal has been published. You can come back and edit any time...");

//       app.resetToSplashScreen();
//     } else {
//       jQuery().toastmessage('showErrorToast', "Please enter a title!");
//     }
//   },

//   createProposalNote: function(titleText, bodyText) {
//     var view = this;

//     var preexistingNote = Skeletor.Model.awake.tiles.where({ 'project_id': app.project.id, 'from_proposal': true, 'title': titleText })[0];

//     if (preexistingNote) {
//       preexistingNote.set('body',bodyText);
//       preexistingNote.save();
//     } else {
//       var m = new Model.Note();
//       m.set('project_id', app.project.id);
//       m.set('author', app.username);
//       m.set('type', "text");
//       m.set('title', titleText);
//       m.set('body', bodyText);
//       m.set('from_proposal', true);
//       m.set('published', true);
//       m.wake(app.config.wakeful.url);
//       m.save();
//       Skeletor.Model.awake.tiles.add(m);
//     }
//   },

//   // this version of autosave works with nested content. The nested structure must be spelled out *in the html*
//   // eg <textarea data-nested="proposal" name="research_question" placeholder="1."></textarea>
//   checkForAutoSave: function(ev) {
//     var view = this,
//         field = ev.target.name,
//         input = ev.target.value;
//     // clear timer on keyup so that a save doesn't happen while typing
//     app.clearAutoSaveTimer();

//     // save after 10 keystrokes
//     app.autoSave(app.project, field, input, false, jQuery(ev.target).data("nested"));

//     // setting up a timer so that if we stop typing we save stuff after 5 seconds
//     app.autoSaveTimer = setTimeout(function(){
//       app.autoSave(app.project, field, input, true, jQuery(ev.target).data("nested"));
//     }, 5000);
//   },

//   render: function () {
//     var view = this;
//     console.log("Rendering ProposalsView...");

//     jQuery('#proposal-screen [name=name]').text(app.project.get('name'));
//     jQuery('#proposal-screen [name=research_question]').text(app.project.get('proposal').research_question);
//     jQuery('#proposal-screen [name=need_to_knows]').text(app.project.get('proposal').need_to_knows);

//     // they can't be allowed to change the name of their project once they've first created it, since it's now the unique identifier (le sigh)
//     if (app.project && app.project.get('proposal').published === true) {
//       jQuery('#proposal-screen [name=name]').addClass('disabled');
//     } else {
//       jQuery('#proposal-screen [name=name]').removeClass('disabled');
//     }
//   }

// });


  /**
    ProjectNewPosterScreen
  **/
  app.View.ProjectNewPosterView = Backbone.View.extend({
    initialize: function() {
      var view = this;
      console.log('Initializing ProjectNewPosterView...', view.el);
    },

    events: {
      'click .create-poster-btn'              : 'createPoster',
      'click .new-poster-theme-button'        : 'toggleThemeButtonStatus'
    },

    toggleThemeButtonStatus: function(ev) {
      jQuery(ev.target).toggleClass('selected');
    },

    createPoster: function() {
      var view = this;
      var posterTitle = jQuery('#project-new-poster-screen [name=poster_title]').val();

      if (jQuery('#project-new-poster-screen [name=poster_title]').val().length > 0) {
        jQuery('.create-poster-btn').addClass('disabled');
        // create all the relevant stuff in the UIC DB (poster and group)
        // (note poster id is project id)
        var posterObj = JSON.stringify({
                          "name": posterTitle,
                          "uuid": app.project.id + '-poster',
                          "created_at" : new Date()
                        });

        var groupObj = JSON.stringify({
                         "classname": app.runId,
                         "name": app.project.get('name'),
                         "nameTags": app.project.get('associated_users'),
                         "posters" : [ app.project.id + '-poster' ],         // always one element in here
                         "uuid" : app.project.id + '-gruser',
                         "created_at": new Date()
                       });

        // We encounter rar cases of user and poster entries with the same UUID. We check via a selector if the UUIDs already exist
        // The UIC drowsy need the URL to be formatted in a certain way to have selectors work (see below)
        // https://ltg.evl.uic.edu/drowsy/poster/user?selector=%7B%22uuid%22:%22552be88b7ea25d29c4000000-gruser%22%7D
        var checkForUUIDinUser = jQuery.get(Skeletor.Mobile.config.drowsy.uic_url + '/user?selector=%7B%22uuid%22:%22' + app.project.id + '-gruser%22%7D');
        var checkForUUIDinPoster = jQuery.get(Skeletor.Mobile.config.drowsy.uic_url + '/poster?selector=%7B%22uuid%22:%22' + app.project.id + '-poster%22%7D');

        jQuery.when( checkForUUIDinUser, checkForUUIDinPoster )
        .done(function (v1, v2) {
          // wonderful syntax. Just easy to read (hello C)
          // We take the result array [0] of both gets (v1 and v2) and ensure they came back empty, aka there is no entry with that UUID
          if (v1[0].length === 0 && v2[0].length === 0) {
            var postPoster = jQuery.post(Skeletor.Mobile.config.drowsy.uic_url + "/poster", posterObj);
            var postUser = jQuery.post(Skeletor.Mobile.config.drowsy.uic_url + "/user", groupObj);

            jQuery.when( postPoster, postUser )
            .done(function (v1, v2) {
              var posterThemes = [];

              // add to the project object in the OISE DB
              app.project.set('poster_title', posterTitle);
              // from the object returned by drowsy, we need to get the mongo id for later
              app.project.set('poster_mongo_id',v1[0]._id.$oid);        // lol, classic mongo syntax. Probably a nicer way of doing this?

              jQuery('#project-new-poster-screen .selected').each(function() {
                posterThemes.push(jQuery(this).val());
              });
              app.project.set('poster_themes', posterThemes);
              app.project.save();

              jQuery().toastmessage('showSuccessToast', "You have started your poster!");
              app.hideAllContainers();
              jQuery('#project-poster-chunk-screen').removeClass('hidden');
              jQuery('.create-poster-btn').removeClass('disabled');
            })
            .fail(function (v1) {
              jQuery().toastmessage('showErrorToast', "There has been an error with poster creation! Please request technical support");
              console.error("There has been an error with poster creation! Please request technical support");
              // handle the error here - deleting from Tony's DB whichever (or both) that failed
              jQuery('.create-poster-btn').removeClass('disabled');
            });
          } else {
            console.warn("The poster and/or user with the following UUID exits: " + app.project.id +"-poster/gruser! Cannot create poster since it is already there!");
            jQuery().toastmessage('showErrorToast', "The poster and/or user with the following UUID exits: " + app.project.id +"-poster/gruser! Cannot create poster since it is already there!");
            jQuery('.create-poster-btn').removeClass('disabled');
          }
        })
        .fail(function (v1) {
          jQuery().toastmessage('showErrorToast', "There has been an error with poster creation! Please request technical support (2)");
          console.error("There has been an error with poster creation! Please request technical support (2)");
          jQuery('.create-poster-btn').removeClass('disabled');
        });


      } else {
        jQuery().toastmessage('showErrorToast', "Please add a title to your poster...");
      }
    },

    switchToReadView: function() {
      app.hideAllContainers();
      jQuery('#project-read-screen').removeClass('hidden');
    },

    render: function() {
      var view = this;
      console.log("Rendering ProjectNewPosterView...");

      // add the theme buttons - need to be careful of random rerenders here, will mess us up
      jQuery('.new-poster-theme-holder').html('');
      if (Skeletor.Model.awake.tags.length > 0) {
        Skeletor.Model.awake.tags.each(function(tag) {
          var button = jQuery('<button class="btn new-poster-theme-button btn-default btn-base" data-name="' + tag.get('name') + '">');
          button.val(tag.get('name'));
          button.text(tag.get('name'));
          jQuery('.new-poster-theme-holder').append(button);
        });
      } else {
        console.warn('Tags collection is empty!');
      }

      jQuery('.new-poster-theme-holder [data-name="' + app.project.get('theme') + '"]').addClass('selected');
    }
  });


  /**
   ** PosterNote View
   **/
  app.View.PosterNote = Backbone.View.extend({
    textTemplate: "#text-tile-template",
    photoTemplate: "#photo-tile-template",
    videoTemplate: "#video-tile-template",

    events: {
      'click'   : 'copyNote'
    },

    initialize: function () {
      var view = this;

      view.model.on('change', function () {
        view.render();
      });

      return view;
    },

    render: function () {
      var view = this,
        tile = view.model,
        listItemTemplate,
        listItem;

      // different types - different tiles
      if (tile.get('type') === "text") {
        // if class is not set do it
        if (!view.$el.hasClass('text-tile-container')) {
          view.$el.addClass('text-tile-container');
        }

        listItemTemplate = _.template(jQuery(view.textTemplate).text());
        listItem = listItemTemplate({ 'id': tile.get('_id'), 'title': tile.get('title'), 'body': tile.get('body') });
      } else if (tile.get('type') === "media" && app.photoOrVideo(tile.get('url')) === "photo") {
        // if class is not set do it
        if (!view.$el.hasClass('photo-tile-container')) {
          view.$el.addClass('photo-tile-container');
        }

        listItemTemplate = _.template(jQuery(view.photoTemplate).text());
        listItem = listItemTemplate({ 'id': tile.get('_id'), 'url': app.config.pikachu.url + tile.get('url') });
      } else if (tile.get('type') === "media" && app.photoOrVideo(tile.get('url')) === "video") {
        // if class is not set do it
        if (!view.$el.hasClass('video-tile-container')) {
          view.$el.addClass('video-tile-container');
        }

        listItemTemplate = _.template(jQuery(view.videoTemplate).text());
        listItem = listItemTemplate({ 'id': tile.get('_id'), 'url': app.config.pikachu.url + tile.get('url') });
      } else {
        throw "Unknown tile type!";
      }

      // handling originator
      if (tile.get('originator') === "self") {
        view.$el.addClass('self');
      }

      // handling new cited concept
      if (tile.get('cited_from_user_uuid') && tile.get('cited_from_poster_uuid') && tile.get('cited_from_poster_item_uuid')) {
        view.$el.addClass('cited');
      }

      // Add the newly generated DOM elements to the view's part of the DOM
      view.$el.html(listItem);

      return view;
    },

    copyNote: function(ev) {
      var view = this;

      // if the clicked tile is text
      if (view.model.get('type') === "text") {
        if (confirm("Would you like to paste this text into your poster content section?")) {
          var text = jQuery('#text-chunk-body-input').val();
          text += ' ' + view.model.get('body');
          jQuery('#text-chunk-body-input').val(text);
        }
      }
      // if the clicked tile is a photo
      else if (view.model.get('type') === "media" && app.photoOrVideo(view.model.get('url')) === "photo") {
        jQuery('#media-chunk-media-holder').html('<img src="' + app.config.pikachu.url + view.model.get('url') + '"/>');
      }
      // if the clicked tile is a video
      else if (view.model.get('type') === "media" && app.photoOrVideo(view.model.get('url')) === "video") {
        //jQuery().toastmessage('showErrorToast', "Video to poster uploading is currently under development...");
        jQuery('#media-chunk-media-holder').html('<video src="' + app.config.pikachu.url + view.model.get('url') + '" controls />');
      } else {
        console.error("Unknown chunk type!");
      }

      if (view.model.get('cited_from_user_uuid') && view.model.get('cited_from_poster_uuid') && view.model.get('cited_from_poster_item_uuid')) {
        if (view.model.get('type') === "text") {
          jQuery('#text-chunk-body-input').data(
            "citation",
            {
              "cited_from_user_uuid" : view.model.get('cited_from_user_uuid'),
              "cited_from_poster_uuid" : view.model.get('cited_from_poster_uuid'),
              "cited_from_poster_item_uuid" : view.model.get('cited_from_poster_item_uuid')
            });
        } else if (view.model.get('type') === "media") {
          jQuery('#media-chunk-body-input').data(
            "citation",
            {
              "cited_from_user_uuid" : view.model.get('cited_from_user_uuid'),
              "cited_from_poster_uuid" : view.model.get('cited_from_poster_uuid'),
              "cited_from_poster_item_uuid" : view.model.get('cited_from_poster_item_uuid')
            });
        } else {
          console.error("Cannot add citation information, unknown tile type");
        }
      }
    }
  });


  /**
    ReviewView
    This is one part of ReviewsView which shows many parts
  **/
  app.View.ReviewView = Backbone.View.extend({
    template: _.template("<button class='project-to-review-btn btn' data-id='<%= _id %>'><%= theme %> - <%= name %></button>"),

    events: {
      'click .project-to-review-btn' : 'switchToProjectDetailsView',
    },

    render: function() {
      var view = this;
      // remove all classes from root element
      view.$el.removeClass();

      // hiding unpublished proposals
      if (view.model.get('proposal').published === false) {
        view.$el.addClass('hidden');
      }

      // here we decide on where to show the review
      if (view.model.get('proposal').review_published === true) { // Is review published
        view.$el.addClass('box4');
      } else if (view.model.get('proposal').review_published === false && !view.model.get('proposal').write_lock) { // unpublished and without write lock --> up for grabs!
        view.$el.addClass('box2');
      } else if (view.model.get('proposal').review_published === false && view.model.get('proposal').write_lock === app.project.get('name')) { // unpublished and with write lock from our project
        view.$el.addClass('box1');
      } else if (view.model.get('proposal').review_published === false && view.model.get('proposal').write_lock && view.model.get('proposal').write_lock !== app.project.get('name')) { // unpublished and with write lock from other projects
        view.$el.addClass('box3');
      } else {
        view.$el.addClass('fail');
      }

      view.$el.html(this.template(view.model.toJSON()));

      // Treat review of own project differently
      if (app.project && view.model.get('name') === app.project.get('name')) {
        // set a class to a) lock the project from being edited by us
        view.$el.find('button').addClass('own-review');
      }

      return this;
    },

    initialize: function () {
      var view = this;
      //console.log('Initializing ReviewView...', view.el);

      view.model.on('change', view.render, view);

      return view;
    },

    switchToProjectDetailsView: function(ev) {
      var view = this;
      // would it be better to instantiate a new model/view here each time?
      // app.reviewDetailsView.model = Skeletor.Model.awake.projects.get(jQuery(ev.target).data("id"));
      app.reviewDetailsView.model = view.model;
      jQuery('#review-overview-screen').addClass('hidden');
      jQuery('#review-details-screen').removeClass('hidden');
      app.reviewDetailsView.render();
    }
  });

  /**
    ReviewsView
  **/
  app.View.ReviewsView = Backbone.View.extend({
    template: _.template('<h2 class="box1">Reviews locked by our project team but not finished</h2><h2 class="box2">Select a proposal to review</h2><h2 class="box3">Reviews locked by other project teams but not finished</h2><h2 class="box4">Completed reviews</h2>'),

    initialize: function() {
      var view = this;
      // console.log('Initializing ReviewsView...', view.el);

      // TODO: This has to be here since elements that are unpublished are not show but add fires on creation. So we have to catch the change :(
      view.collection.on('change', function(n) {
        view.render();
      });

      view.collection.on('add', function(n) {
        // view.addOne(n);
        view.render();
      });

      return view;
    },

    events: {
      'click .project-to-review-btn' : 'switchToProjectDetailsView',
    },


    addOne: function(proj) {
      var view = this;
      // wake up the project model
      proj.wake(app.config.wakeful.url);
      var reviewItemView = new app.View.ReviewView({model: proj});
      var listToAddTo = view.$el.find('.inner-wrapper');
      listToAddTo.append(reviewItemView.render().el);
    },

    render: function () {
      var view = this;
      console.log("Rendering ReviewsView...");

      // clear the area
      view.$el.find('.inner-wrapper').html('');

      // add the headers
      var headers = view.template();
      view.$el.find('.inner-wrapper').append(headers);

      // sort by theme
      view.collection.comparator = function(model) {
        return model.get('theme');
      };

      var publishedProjectProposals = view.collection.sort().filter(function(proj) {
        return (app.project && proj.get('proposal').published === true && proj.get('theme'));
      });

      publishedProjectProposals.forEach(function(proposal) {
        view.addOne(proposal);
      });
    }

  });


  /**
    ReviewDetailsView
  **/
  app.View.ReviewDetailsView = Backbone.View.extend({
    template: '',
    // template: '#review-details-template',

    initialize: function () {
      var view = this;
      console.log('Initializing ReviewDetailsView...', view.el);

      view.template = _.template(jQuery('#review-details-template').text());

      return view;
    },

    events: {
      'click #return-to-overview-btn' : 'switchToProjectOverviewView',
      'click #publish-review-btn'     : 'publishReview',
      'click #cancel-review-btn'      : 'cancelReview',
      'keyup :input'                  : 'startModifying'
    },

    publishReview: function() {
      var view = this;

      var reviewResearchQuestion = jQuery('#review-details-screen [name=review_research_question]').val();
      var reviewNeedToKnows = jQuery('#review-details-screen [name=review_need_to_knows]').val();

      if (reviewResearchQuestion.length > 0 && reviewNeedToKnows.length > 0) {
        app.clearAutoSaveTimer();
        var proposal = view.model.get('proposal');
        proposal.review_research_question = jQuery('#review-details-screen [name=review_research_question]').val();
        proposal.review_need_to_knows = jQuery('#review-details-screen [name=review_need_to_knows]').val();
        proposal.reviewer = app.groupname;
        proposal.review_published = true;
        view.model.set('proposal',proposal);
        // view.switchToProjectOverviewView();
        view.model.save();
        jQuery().toastmessage('showSuccessToast', "Your review has been sent!");
        view.switchToProjectOverviewView();
      } else {
        jQuery().toastmessage('showErrorToast', "Please complete your review before submitting...");
      }
    },

    cancelReview: function() {
      var view = this;

      if (confirm("Are you sure you want to delete this review?")) {
        app.clearAutoSaveTimer();
        var proposal = view.model.get('proposal');
        proposal.review_research_question = "";
        proposal.review_need_to_knows = "";
        // Also remove the lock
        delete proposal.write_lock;
        view.model.set('proposal',proposal);
        view.model.save();
        jQuery('.input-field').val('');
        view.switchToProjectOverviewView();
      }
    },

    switchToProjectOverviewView: function(ev) {
      var view = this;
      // view.model = null;
      jQuery('#review-details-screen').addClass('hidden');
      jQuery('#review-overview-screen').removeClass('hidden');
      app.reviewsView.render(); // I hate this but somehow all other clients rerender but not ourselves
    },

    startModifying: function(ev) {
      var view = this;

      // set a write lock on the model
      var proposal = view.model.get('proposal');
      proposal.write_lock = app.project.get('name');
      view.model.save();

      view.checkForAutoSave(ev);
    },

    checkForAutoSave: function(ev) {
      var view = this,
          field = ev.target.name,
          input = ev.target.value;
      // clear timer on keyup so that a save doesn't happen while typing
      app.clearAutoSaveTimer();

      // save after 10 keystrokes
      app.autoSave(view.model, field, input, false, jQuery(ev.target).data("nested"));

      // setting up a timer so that if we stop typing we save stuff after 5 seconds
      app.autoSaveTimer = setTimeout(function(){
        app.autoSave(view.model, field, input, true, jQuery(ev.target).data("nested"));
      }, 5000);
    },

    render: function () {
      var view = this;
      console.log("Rendering ReviewDetailsView...");
      // clearing the root element of the view
      view.$el.html("");
      // create json object from model
      var modJson = view.model.toJSON();
      var pWriteLock = view.model.get('proposal').write_lock;
      // if the proposal has a write lock
      if (typeof pWriteLock === 'undefined' || pWriteLock === null || pWriteLock === app.project.get('name')) {
        modJson.write_lock = false;
      } else {
        modJson.write_lock = true;
      }

      // We now show reviews for our own projects and when a user enters we treat it as if it locked but we don;t use the lock
      if (!modJson.write_lock && app.project && view.model.get('name') === app.project.get('name')) {
        modJson.write_lock = true;
      }

      // create everything by rendering a template
      view.$el.html(view.template(modJson));
      return view;
    }

  });

  this.Skeletor = Skeletor;
}).call(this);
