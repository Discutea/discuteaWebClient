<span role="button" class="user {{modes data.mode}}" data-name="{{data.from}}">{{data.mode}}{{data.from}}</span>
{{ trans 'action_kick' locale }}
<span role="button" class="user" data-name="{{data.target}}">{{data.target}}</span>
{{#if data.text}}
    <i class="part-reason">({{{parse data.text}}})</i>
{{/if}}
