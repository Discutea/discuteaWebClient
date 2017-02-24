<span role="button" class="user" data-name="{{from}}">{{from}}</span>
invited
{{#if invitedYou}}
	you
{{else}}
	<span role="button" class="user" data-name="{{invited}}">{{invited}}</span>
{{/if}}
to
{{{parse channel}}}
