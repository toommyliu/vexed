function connection([state]) {
	if (state === 'OnConnection') {
		$('#cells').removeAttr('disabled');
		$('#pads').removeAttr('disabled');
	} else if (state === 'OnConnectionLost') {
		$('#cells').attr('disabled', true);
		$('#pads').attr('disabled', true);
	}
}
