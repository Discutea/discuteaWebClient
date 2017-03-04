<span role="button" class="user {{modes mode}}" data-name="{{from}}">{{mode}}{{from}}</span>
<i class="hostmask">({{hostmask}})</i>
{{ trans 'action_part' locale }}
{{#if text}}
	<i class="part-reason">({{{parse text}}})</i>
{{/if}}
