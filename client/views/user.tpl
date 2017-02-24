{{#if users.length}}
<div class="count">
	<input class="search" placeholder="{{users users.length}}" aria-label="Search among the user list">
</div>
{{/if}}

<div class="names">
	{{#each users}}
		<span role="button" class="user {{modes mode}} {{colorGecos gecos}}" data-name="{{name}}">{{mode}}{{name}}</span>
        {{ log name }} {{ log gecos }}
	{{/each}}
</div>
