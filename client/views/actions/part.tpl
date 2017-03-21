<span role="button" class="user {{modes data.mode}}" data-name="{{data.from}}">{{data.mode}}{{data.from}}</span>
<i class="hostmask">({{data.hostmask}})</i>
{{ trans 'action_part' locale }}
{{#if text}}
    <i class="part-reason">({{{parse data.text}}})</i>
{{/if}}
