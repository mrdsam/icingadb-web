<?php

namespace Icinga\Module\Icingadb\Forms;

use Icinga\Data\ResourceFactory;
use Icinga\Forms\ConfigForm;

class DatabaseConfigForm extends ConfigForm
{
    public function init()
    {
        $this->setSubmitLabel($this->translate('Save Changes'));
    }

    public function createElements(array $formData)
    {
        $dbResources = ResourceFactory::getResourceConfigs('db')->keys();

        $this->addElement('select', 'icingadb_resource', [
            'description'  => $this->translate('Database resource'),
            'label'        => $this->translate('Database'),
            'multiOptions' => array_combine($dbResources, $dbResources),
            'required'     => true,
            'value'        => 'icingadb'
        ]);
    }
}