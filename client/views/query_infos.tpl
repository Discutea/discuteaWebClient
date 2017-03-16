<div class="first">
  {{#if operator}}
    <p class="admin tooltipped tooltipped-n" aria-label="{{ trans 'tool_admin' locale }}">
      {{ trans 'admin' locale }}
    </p>
  {{/if}}
  {{#if helpop}}
    <p class="helper tooltipped tooltipped-n" aria-label="{{ trans 'tool_helper' locale }}">
      {{ trans 'helper' locale }}
    </p>
  {{/if}}
  {{#if account}}
    <p class="vip tooltipped tooltipped-n" aria-label="{{ trans 'tool_vip' locale }} {{account}}">
    {{#if server}}
        <a target="_blank" href="{{{ parseUrl server }}}/user/{{account}}">{{ trans 'vip' locale }}</a>
    {{else}}
      {{ trans 'vip' locale }}
    {{/if}}
    </p>
  {{/if}}
  
  <p>
    {{#if sex}}
      <span class="{{ sex }}">{{ trans sex locale }}</span>, 
    {{/if}}
    {{#if age}}
      {{ age }} {{ trans 'years_old' locale }}
    {{/if}}
  </p>

  {{#if loc}}
    <p>{{loc}}</p>
  {{/if}}
</div>

{{#if channels}}
  <p>{{ trans 'action_whois_follow_chans' locale }}</p>
  <p>{{{parse channels}}}</p>
{{/if}}
{{#if away}}
  <p>{{ trans 'action_whois_away' locale }}</p>
  <p><i>({{away}})</i></p>
{{/if}}

{{#unless operator}}
  <div class="hdiscutea">
    <a class="btn btn-default btn-xs silence{{#if locked}} locked{{/if}}" data-target="{{ host }}" data-nick="{{ nick }}" href="#">
     {{#if locked}}
       {{ trans 'unblock' locale }}
     {{else}}
       {{ trans 'block' locale }}
     {{/if}}
    </a>
  </div>
{{/unless}}
