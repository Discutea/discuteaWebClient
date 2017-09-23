{{#each channels}}
<div id="chan-{{id}}" data-title="{{name}}" data-id="{{id}}" data-type="{{type}}" data-target="#chan-{{id}}" class="chan {{type}}">
    <div class="header">
        <button class="lt" aria-label="Toggle channel list"></button>
        <span class="rt-tooltip tooltipped tooltipped-w" aria-label="Fermer">
            <button class="viewmenu closeclose" aria-label="Fermer" data-action="close" data-data="#chan-{{id}}"></button>
        </span>   

        {{#equal type "channel"}}
            <span class="rt-tooltip tooltipped tooltipped-w" aria-label="Toggle user list">
                <button class="viewmenu rt" aria-label="Toggle user list"></button>
            </span>
        {{/equal}}
        {{#equal type "query"}}
            <span class="ri-tooltip tooltipped tooltipped-w" aria-label="Toggle user infos">
                <button class="viewmenu ri" aria-label="Toggle user infos"></button>
            </span>
        {{/equal}}
        <span class="rt-tooltip tooltipped tooltipped-w" aria-label="Liste des ignorés">
          <button class="viewmenu ignores_list"></button>
        </span>
        <span class="rt-tooltip tooltipped tooltipped-w" aria-label="Liste des salons">
          <button class="viewmenu channels_list"></button>
        </span>
        <span class="title">{{name}}</span>
        <span title="{{topic}}" class="topic">{{{parse topic}}}</span>
    </div>
    <div class="chat">
     <div class="messages">
     </div>
    </div>
    <aside class="sidebar">
        <div class="users"></div>
    </aside>
</div>
{{/each}}
