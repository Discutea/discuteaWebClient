{{#if from}}
	<span role="button" class="user {{modes mode}}" data-name="{{from}}">{{mode}}{{from}}</span>
	has changed the topic to:
{{else}}
	The topic is:
{{/if}}

<span class="new-topic">{{{parse text}}}</span>
