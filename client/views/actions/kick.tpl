<span role="button" class="user {{modes mode}}" data-name="{{from}}">{{mode}}{{from}}</span>
{{ trans 'action_kick' locale }}
<span role="button" class="user" data-name="{{target}}">{{target}}</span>
{{#if text}}
    <i class="part-reason">({{{parse text}}})</i>
{{/if}}
