<span role="button" class="user {{modes data.mode}}" data-name="{{data.from}}">{{data.mode}}{{data.from}}</span>
<i class="hostmask">({{data.hostmask}})</i>
{{ trans 'action_quit' locale }}
{{#if data.text}}
    <i class="quit-reason">({{{parse data.text}}})</i>
{{/if}}
