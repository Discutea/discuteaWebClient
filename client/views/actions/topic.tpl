{{#if from}}
    <span role="button" class="user {{modes data.mode}}" data-name="{{data.from}}">{{data.mode}}{{data.from}}</span>
    {{ trans 'action_topic' locale }}
{{else}}
    {{ trans 'action_topic_is' locale }}
{{/if}}

<span class="new-topic">{{{parse data.text}}}</span>
