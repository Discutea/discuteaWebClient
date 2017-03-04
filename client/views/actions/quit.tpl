<span role="button" class="user {{modes mode}}" data-name="{{from}}">{{mode}}{{from}}</span>
<i class="hostmask">({{hostmask}})</i>
{{ trans 'action_quit' locale }}
{{#if text}}
	<i class="quit-reason">({{{parse text}}})</i>
{{/if}}
