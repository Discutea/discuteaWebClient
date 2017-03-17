{{#each channels}}
<div id="chan-{{id}}" data-title="{{name}}" data-id="{{id}}" data-type="{{type}}" data-target="#chan-{{id}}" class="chan {{type}}">
    <div class="header">
        <button class="lt" aria-label="Toggle channel list"></button>
        {{#equal type "channel"}}
            <span class="rt-tooltip tooltipped tooltipped-w" aria-label="Toggle user list">
                <button class="rt" aria-label="Toggle user list"></button>
            </span>
        {{/equal}}
        {{#equal type "query"}}
            <span class="rt-tooltip tooltipped tooltipped-w" aria-label="Toggle user infos">
                <button class="ri" aria-label="Toggle user infos"></button>
            </span>
        {{/equal}}
        <button class="menu" aria-label="Open the context menu"></button>
        <span class="title">{{name}}</span>
        <span title="{{topic}}" class="topic">{{{parse topic}}}</span>
    </div>
    <div class="chat">
     <div class="messages">
       <div style="text-align:center;">
         <script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
         <!-- tchat rencontre -->
         <ins class="adsbygoogle"
              style="display:inline-block;width:468px;height:60px"
              data-ad-client="ca-pub-5805634046586807"
              data-ad-slot="1535783596"></ins>
         <script>
           (adsbygoogle = window.adsbygoogle || []).push({});
         </script>
       </div>
     </div>
    </div>
    <aside class="sidebar">
        <div class="users"></div>
    </aside>
</div>
{{/each}}
