<div class="first">
  {{#if data.operator}}
    <p class="admin tooltipped tooltipped-n" aria-label="{{ trans 'tool_admin' locale }}">
      {{ trans 'admin' locale }}
    </p>
  {{/if}}
  {{#if data.helpop}}
    <p class="helper tooltipped tooltipped-n" aria-label="{{ trans 'tool_helper' locale }}">
      {{ trans 'helper' locale }}
    </p>
  {{/if}}
  {{#if data.account}}
    <p class="vip tooltipped tooltipped-n" aria-label="{{ trans 'tool_vip' locale }} {{data.account}}">
    {{#if data.server}}
        <a target="_blank" href="{{{ parseUrl data.server }}}/user/{{data.account}}">{{ trans 'vip' locale }}</a>
    {{else}}
      {{ trans 'vip' locale }}
    {{/if}}
    </p>
  {{/if}}
  <p>
    {{#if data.sex}}
      <span class="{{ data.sex }}">{{ trans data.sex locale }}</span>, 
    {{/if}}
    {{#if data.age}}
      {{ data.age }} {{ trans 'years_old' locale }}
    {{/if}}
  </p>

  {{#if data.loc}}
    <p>{{data.loc}}</p>
  {{/if}}
</div>

{{#if data.channels}}
  <p>{{ trans 'action_whois_follow_chans' locale }}</p>
  <p>{{{parse data.channels}}}</p>
{{/if}}
{{#if data.away}}
  <p>{{ trans 'action_whois_away' locale }}</p>
  <p><i>({{data.away}})</i></p>
{{/if}}

{{#unless data.operator}}
  <div class="hdiscutea">
    <a class="btn btn-default btn-xs silence{{#if locked}} locked{{/if}}" data-target="{{ data.host }}" data-nick="{{ data.nick }}" href="#">
     {{#if locked}}
       {{ trans 'unblock' locale }}
     {{else}}
       {{ trans 'block' locale }}
     {{/if}}
    </a>
  </div>
{{/unless}}
