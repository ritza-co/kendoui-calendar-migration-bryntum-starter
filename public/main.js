function sanitizeHtml(html) {
    var temp = $('<div></div>').html(window.DOMPurify.sanitize(html));
    return temp.html() || '';
}

const scheduler = $(async function() {
    let resourcesData = [];
    let filtersArr = [];

    await $.ajax({
        url      : '/api/resources/get',
        dataType : 'json',
        success  : function(result) {
            resourcesData = result;
            filtersArr = result.map(function(resource) {
                return { field : 'ownerId', operator : 'eq', value : resource.value };
            });
        },
        error : function(result) {
            console.error(result);
        }
    });

    $('#scheduler').kendoScheduler({
        date      : new Date('2024/9/9'),
        startTime : new Date('2024/9/9 08:00 AM'),
        views     : ['day', { type : 'week', selected : true }, 'month', 'year', 'agenda'],
        toolbar   : {
            items : [
                ['today', 'previous', 'next'],
                'current',
                { type : 'spacer' },
                {
                    template : function() {
                        const checkboxesHtml = resourcesData
                            .map(function(resource) {
                                return sanitizeHtml(`
                  <label style="color: ${resource.color};">
                    <input checked type="checkbox" value="${resource.value}" aria-label="${resource.text}">
                    ${resource.text}
                  </label>`);
                            })
                            .join('');
                        return `<div id="people">${checkboxesHtml}</div>`;
                    }
                },
                { type : 'spacer' },
                'search',
                { type : 'spacer' },
                'views'
            ]
        },
        timezone   : 'Etc/UTC',
        dataSource : {
            transport : {
                read : function(options) {
                    $.ajax({
                        url      : '/api/tasks/get',
                        dataType : 'json',
                        success  : function(result) {
                            options.success(result);
                        },
                        error : function(result) {
                            options.error(result);
                        }
                    });
                },
                submit : function(e) {
                    var data = e.data;
                    // Send batch update to desired URL, then notify success/error.
                    $.ajax({
                        url      : '/api/tasks/sync',
                        type     : 'POST',
                        dataType : 'json',
                        data,
                        success  : function(data) {
                            e.success(data.updated, 'update');
                            e.success(data.created, 'create');
                            e.success(data.destroyed, 'destroy');
                        },
                        error : function(result) {
                            e.error(result, 'customerror', 'custom error');
                        }
                    });
                }
            },
            batch  : true,
            schema : {
                model : {
                    id     : 'id',
                    fields : {
                        id    : { type : 'number' },
                        title : {
                            defaultValue : 'No title',
                            validation   : { required : true }
                        },
                        start               : { type : 'date' },
                        end                 : { type : 'date' },
                        startTimezone       : { type : 'string' },
                        endTimezone         : { type : 'string' },
                        description         : { type : 'string' },
                        recurrenceId        : { type : 'string' },
                        recurrenceRule      : { type : 'string' },
                        reccurenceException : { type : 'string' },
                        ownerId             : { type : 'number', validation : { required : true } },
                        isAllDay            : { type : 'boolean' }
                    }
                }
            },
            filter : {
                logic   : 'or',
                filters : filtersArr
            }
        },
        resources : [
            {
                field      : 'ownerId',
                title      : 'Owner',
                dataSource : resourcesData
            }
        ]
    });

    $('#people :checkbox').change(function(e) {
        var checked = $.map($('#people :checked'), function(checkbox) {
            return parseInt($(checkbox).val());
        });

        var scheduler = $('#scheduler').data('kendoScheduler');

        scheduler.dataSource.filter({
            operator : function(task) {
                return $.inArray(task.ownerId, checked) >= 0;
            }
        });
    });
});
