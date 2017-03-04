<span role="button" class="user" data-name="{{from}}">{{from}}</span>
{{ trans 'action_invite_invited' locale }}
{{#if invitedYou}}
    {{ trans 'you' locale }}
{{else}}
	<span role="button" class="user" data-name="{{invited}}">{{invited}}</span>
{{/if}}
{{ trans 'to' locale }}
{{{parse channel}}}
