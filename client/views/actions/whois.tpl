<div>
	<span role="button" class="user" data-name="{{whois.nick}}">{{whois.nick}}</span>
	<i class="hostmask">({{whois.user}}@{{whois.host}})</i>:
	<b>{{whois.real_name}}</b>
</div>
{{#if whois.account}}
<div>
	<span role="button" class="user" data-name="{{whois.nick}}">{{whois.nick}}</span>
    {{ trans 'action_whois_logged' locale }} <b>{{whois.account}}</b>
</div>
{{/if}}
{{#if whois.channels}}
<div>
	<span role="button" class="user" data-name="{{whois.nick}}">{{whois.nick}}</span>
    {{ trans 'action_whois_follow_chans' locale }} {{{parse whois.channels}}}
</div>
{{/if}}
{{#if whois.server}}
<div>
	<span role="button" class="user" data-name="{{whois.nick}}">{{whois.nick}}</span>
    {{ trans 'action_whois_connected' locale }} {{whois.server}} <i>({{whois.server_info}})</i>
</div>
{{/if}}
{{#if whois.secure}}
<div>
	<span role="button" class="user" data-name="{{whois.nick}}">{{whois.nick}}</span>
    {{ trans 'action_whois_secure' locale }}
</div>
{{/if}}
{{#if whois.away}}
<div>
	<span role="button" class="user" data-name="{{whois.nick}}">{{whois.nick}}</span>
	{{ trans 'action_whois_away' locale }} <i>({{whois.away}})</i>
</div>
{{/if}}
{{#if whois.idle}}
<div>
	<span role="button" class="user" data-name="{{whois.nick}}">{{whois.nick}}</span>
	{{ trans 'action_whois_idle' locale }} {{localetime whois.idleTime}}.
</div>
{{/if}}
