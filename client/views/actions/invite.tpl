<span role="button" class="user" data-name="{{data.from}}">{{data.from}}</span>
{{ trans 'action_invite_invited' locale }}
{{#if data.invitedYou}}
    {{ trans 'you' locale }}
{{else}}
    <span role="button" class="user" data-name="{{data.invited}}">{{data.invited}}</span>
{{/if}}
{{ trans 'to' locale }}
{{{parse data.channel}}}
