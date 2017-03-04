{{#if from}}
	<span role="button" class="user {{modes mode}}" data-name="{{from}}">{{mode}}{{from}}</span>
    {{ trans 'action_topic' locale }}
{{else}}
    {{ trans 'action_topic_is' locale }}
{{/if}}

<span class="new-topic">{{{parse text}}}</span>
